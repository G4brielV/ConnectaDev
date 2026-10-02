import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/auth";

const RMR_CITIES = ["Recife", "Olinda", "Jaboatão", "Jaboatao", "Paulista", "Camaragibe", "São Lourenço", "Sao Lourenco", "Igarassu", "Abreu e Lima", "Cabo de Santo Agostinho"];
const EMPTY_JOBS_MESSAGE = "Não foi possível atualizar as vagas no momento. Volte em breve!";
const AREA_CATEGORIES: Record<string, string[]> = {
  "Desenvolvimento de Software": ["Desenvolvimento de Software", "Backend", "Frontend", "Mobile"],
  "Dados e Inteligência Artificial": ["Dados e Inteligência Artificial", "Dados"],
  "Cibersegurança": ["Cibersegurança", "Segurança"],
  "Infraestrutura e Redes": ["Infraestrutura e Redes", "Infraestrutura", "Redes", "DevOps"],
  "Design e Experiência do Usuário": ["Design e Experiência do Usuário", "Design", "UX", "UI"],
  "Gestão de Produtos de Tecnologia": [
    "Gestão de Produtos de Tecnologia",
    "Produto",
    "Product Management",
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
  contractType: "Estágio" | "Júnior" | "Pleno" | "Sênior" | "Outro";
  updatedAt: Date;
}

export interface JobRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  jobs: JobRecommendation[];
  message?: string;
  canRetry: boolean;
}

export async function getJobRecommendations(
  userId: string,
  repository: JobsRepository = prisma,
): Promise<JobRecommendationsResponse> {
  const diagnosis = await repository.vocationalDiagnosis.findUnique({
    where: { userId },
    select: { areaPrincipal: true },
  });
  const areaPrincipal = diagnosis?.areaPrincipal.trim() ?? "";
  const hasDiagnosis = areaPrincipal.length > 0;

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
      updatedAt: true,
    },
  }).then((items) =>
    items
      .map((job) => ({
        ...job,
        contractType: getContractType(`${job.title} ${job.description}`),
      }))
      .filter(
        (job) =>
          TECH_CATEGORIES.has(job.category) &&
          hasTechTerm(job.title) &&
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
