import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/auth";
import { categorizeJob } from "./categorizeJob.service";

const RMR_CITIES = ["Recife", "Olinda", "Jaboatão", "Jaboatao", "Paulista", "Camaragibe", "São Lourenço", "Sao Lourenco", "Igarassu", "Abreu e Lima", "Cabo de Santo Agostinho"];
const EMPTY_JOBS_MESSAGE = "Não foi possível atualizar as vagas no momento. Volte em breve!";
const AREA_CATEGORIES: Record<string, string[]> = {
  "Desenvolvimento de Software": ["Desenvolvimento de Software", "Backend", "Frontend", "Mobile", "TECNOLOGIA_GERAL"],
  "Dados e Inteligência Artificial": ["Dados e Inteligência Artificial", "Dados", "TECNOLOGIA_GERAL"],
  "Cibersegurança": ["Cibersegurança", "Segurança", "TECNOLOGIA_GERAL"],
  "Infraestrutura e Redes": ["Infraestrutura e Redes", "Infraestrutura", "Redes", "DevOps", "TECNOLOGIA_GERAL"],
  "Design e Experiência do Usuário": ["Design e Experiência do Usuário", "Design", "UX", "UI", "TECNOLOGIA_GERAL"],
  "Gestão de Produtos de Tecnologia": [
    "Gestão de Produtos de Tecnologia",
    "Produto",
    "Product Management",
    "TECNOLOGIA_GERAL",
  ],
};
const TECH_CATEGORIES = new Set(Object.values(AREA_CATEGORIES).flat());
const TECH_KEYWORDS = [
  "desenvolv",
  "backend",
  "frontend",
  "front-end",
  "mobile",
  "software",
  "program",
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "node",
  "dados",
  "sql",
  "qa",
  "testes",
  "infraestrutura",
  "devops",
  "cloud",
  "rede",
  "linux",
  "seguranca",
  "cyber",
  "ux",
  "ui",
  "produto digital",
];

type JobsRepository = Pick<PrismaClient, "vocationalDiagnosis" | "job">;

export interface JobRecommendation {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  link: string;
  category: string;
  matchPercentage: number;
  contractType: "Estágio" | "Júnior" | "Pleno" | "Sênior" | "Outro";
  updatedAt: Date;
}

export interface JobMatchInput {
  areaPrincipal: string;
  userTechnologies: readonly string[];
  category: string;
  tags: readonly string[];
  title: string;
  description: string;
}

export function calculateJobMatch(input: JobMatchInput): number {
  if (!input.areaPrincipal) {
    return 0;
  }

  const areaScore = matchesArea(input.areaPrincipal, input.category) ? 40 : 0;
  const classifiedJob = categorizeJob(input.title, input.description);
  const jobTechnologies = [...input.tags, ...classifiedJob.tags];
  const technologies = deduplicateNormalized(input.userTechnologies);

  if (technologies.length === 0) {
    return areaScore;
  }

  const matchedTechnologies = technologies.filter((technology) =>
    jobTechnologies.some((jobTechnology) =>
      technologiesMatch(technology, jobTechnology),
    ),
  ).length;
  const technologyScore = Math.round((matchedTechnologies / technologies.length) * 60);

  return areaScore + technologyScore;
}

export interface JobRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  jobs: JobRecommendation[];
  message?: string;
  canRetry: boolean;
}

function matchesArea(areaPrincipal: string, category: string): boolean {
  if (category === "TECNOLOGIA_GERAL") {
    return false;
  }

  const categories = AREA_CATEGORIES[areaPrincipal] ?? [areaPrincipal];
  return categories.some((candidate) => normalize(candidate) === normalize(category));
}

function technologiesMatch(left: string, right: string): boolean {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function deduplicateNormalized(values: readonly string[]): string[] {
  const unique = new Map<string, string>();
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) {
      unique.set(normalized, value);
    }
  }
  return [...unique.values()];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export async function getJobRecommendations(
  userId: string,
  repository: JobsRepository = prisma,
): Promise<JobRecommendationsResponse> {
  const diagnosis = await repository.vocationalDiagnosis.findUnique({
    where: { userId },
    select: { areaPrincipal: true, tecnologiasSugeridas: true },
  });
  const areaPrincipal = diagnosis?.areaPrincipal.trim() ?? "";
  const hasDiagnosis = areaPrincipal.length > 0;
  const userTechnologies = asStringArray(diagnosis?.tecnologiasSugeridas);

  const jobs = await repository.job.findMany({
    where: {
      isExpired: false,
      ...(hasDiagnosis
        ? { category: { in: AREA_CATEGORIES[areaPrincipal] ?? [areaPrincipal] } }
        : {}),
      OR: RMR_CITIES.map((city) => ({ location: { contains: city } })),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      externalId: true,
      title: true,
      company: true,
      location: true,
      description: true,
      salary: true,
      link: true,
      category: true,
      tags: true,
      updatedAt: true,
    },
  }).then((items) =>
    items
      .map((job) => ({
        ...job,
        matchPercentage: calculateJobMatch({
          areaPrincipal,
          userTechnologies,
          category: job.category,
          tags: job.tags ?? [],
          title: job.title,
          description: job.description,
        }),
        contractType: getContractType(`${job.title} ${job.description}`),
      }))
      .filter(
        (job) =>
          TECH_CATEGORIES.has(job.category) &&
          (job.category === "TECNOLOGIA_GERAL" || hasTechTerm(job.title)) &&
          !hasExcludedNonTechRole(`${job.title} ${job.description}`),
      )
      .sort((left, right) => {
        const contractOrder = {
          "Estágio": 0,
          "Júnior": 1,
          "Pleno": 2,
          "Sênior": 3,
          "Outro": 4,
        } as const;
        const orderDifference =
          contractOrder[left.contractType] - contractOrder[right.contractType];

        return orderDifference || right.updatedAt.getTime() - left.updatedAt.getTime();
      })
      .map(({ contractType, ...job }) => ({ ...job, contractType })),
  );

  return {
    hasDiagnosis,
    areaPrincipal,
    jobs,
    ...(jobs.length === 0 ? { message: EMPTY_JOBS_MESSAGE } : {}),
    canRetry: jobs.length === 0,
  };
}

function getContractType(value: string): JobRecommendation["contractType"] {
  const normalized = normalize(value);

  if (normalized.includes("estagio")) {
    return "Estágio";
  }
  if (normalized.includes("junior") || normalized.includes("trainee") || normalized.includes("entry level")) {
    return "Júnior";
  }
  if (normalized.includes("pleno") || normalized.includes("mid-level")) {
    return "Pleno";
  }
  if (normalized.includes("senior") || normalized.includes("specialist") || normalized.includes("lead")) {
    return "Sênior";
  }
  return "Outro";
}

function hasExcludedNonTechRole(value: string): boolean {
  const normalized = normalize(value);
  return [
    "administrativ",
    "bibliotec",
    "trabalhist",
    "recepcion",
    "vendedor",
    "comercial",
    "financeir",
    "contabil",
    "juridic",
    "enferm",
    "marketing",
  ].some((term) => normalized.includes(term));
}

function hasTechTerm(value: string): boolean {
  const normalized = normalize(value);
  return TECH_KEYWORDS.some((term) => normalized.includes(normalize(term)));
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
