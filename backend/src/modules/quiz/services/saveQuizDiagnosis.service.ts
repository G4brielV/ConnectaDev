import { prisma } from "../../../lib/auth";
import type { submitQuiz } from "./submitQuiz.service";

export type QuizAnalysisResult = Awaited<ReturnType<typeof submitQuiz>>;

export interface SaveQuizDiagnosisTx {
  vocationalDiagnosis: {
    upsert: (args: {
      where: { userId: string };
      create: {
        userId: string;
        areaPrincipal: string;
        areasSecundarias: string[];
        tecnologiasSugeridas: string[];
      };
      update: {
        areaPrincipal: string;
        areasSecundarias: string[];
        tecnologiasSugeridas: string[];
      };
    }) => Promise<unknown>;
  };
  userTrailProgress: {
    updateMany: (args: {
      where: { userId: string };
      data: {
        passed: boolean;
        stars: number;
        bestCorrect: number;
        bestPercentage: number;
        attempts: number;
        totalQuestions: number;
        completedAt: null;
      };
    }) => Promise<unknown>;
  };
}

export type RunInTransaction = <T>(
  callback: (tx: SaveQuizDiagnosisTx) => Promise<T>,
) => Promise<T>;

const defaultRunInTransaction: RunInTransaction = (callback) =>
  prisma.$transaction((tx) => callback(tx));

/**
 * Salva o novo diagnóstico vocacional e reinicia o progresso da trilha em
 * transação atômica. Mantém `xpAwarded` (e o histórico de XP/ofensiva) para
 * evitar perda de XP já conquistado e impedir farm repetido de XP nas fases.
 */
export async function saveQuizDiagnosis(
  userId: string,
  result: QuizAnalysisResult,
  runInTransaction: RunInTransaction = defaultRunInTransaction,
): Promise<void> {
  await runInTransaction(async (tx) => {
    await tx.vocationalDiagnosis.upsert({
      where: { userId },
      create: {
        userId,
        areaPrincipal: result.areaPrincipal,
        areasSecundarias: result.areasSecundarias,
        tecnologiasSugeridas: result.tecnologiasSugeridas,
      },
      update: {
        areaPrincipal: result.areaPrincipal,
        areasSecundarias: result.areasSecundarias,
        tecnologiasSugeridas: result.tecnologiasSugeridas,
      },
    });

    await tx.userTrailProgress.updateMany({
      where: { userId },
      data: {
        passed: false,
        stars: 0,
        bestCorrect: 0,
        bestPercentage: 0,
        attempts: 0,
        totalQuestions: 0,
        completedAt: null,
      },
    });
  });
}
