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
  contractType: "Estágio" | "Jovem Aprendiz" | "Bolsa" | "Outro";
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
    items.map((job) => ({
      ...job,
      contractType: getContractType(`${job.title} ${job.description}`),
    })),
  );

  return {
    hasDiagnosis,
    areaPrincipal,
    jobs,
    ...(jobs.length === 0 ? { message: EMPTY_JOBS_MESSAGE } : {}),
    canRetry: jobs.length === 0,
  };
}

function getContractType(
  value: string,
): JobRecommendation["contractType"] {
  const normalized = value.toLocaleLowerCase("pt-BR");

  if (normalized.includes("jovem aprendiz") || normalized.includes("aprendiz")) {
    return "Jovem Aprendiz";
  }
  if (normalized.includes("bolsa") || normalized.includes("residência")) {
    return "Bolsa";
  }
  if (normalized.includes("estágio") || normalized.includes("estagio")) {
    return "Estágio";
  }
  return "Outro";
}
