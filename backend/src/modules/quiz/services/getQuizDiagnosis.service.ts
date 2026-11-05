import { prisma } from "../../../lib/auth";

export interface QuizDiagnosisStatus {
  completed: boolean;
  areaPrincipal: string | null;
  tecnologiasSugeridas: string[];
}

export interface QuizDiagnosisRepository {
  findDiagnosis: (userId: string) => Promise<{
    areaPrincipal: string;
    tecnologiasSugeridas: unknown;
  } | null>;
}

const defaultRepository: QuizDiagnosisRepository = {
  findDiagnosis: async (userId) => {
    return prisma.vocationalDiagnosis.findUnique({
      where: { userId },
      select: { areaPrincipal: true, tecnologiasSugeridas: true },
    });
  },
};

function parseTechnologies(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

// Indica se o usuário já concluiu o Quiz Vocacional (usado para o onboarding pós-cadastro)
export async function getQuizDiagnosisService(
  userId: string,
  repository: QuizDiagnosisRepository = defaultRepository,
): Promise<QuizDiagnosisStatus> {
  const diagnosis = await repository.findDiagnosis(userId);

  if (!diagnosis) {
    return { completed: false, areaPrincipal: null, tecnologiasSugeridas: [] };
  }

  return {
    completed: true,
    areaPrincipal: diagnosis.areaPrincipal,
    tecnologiasSugeridas: parseTechnologies(diagnosis.tecnologiasSugeridas),
  };
}
