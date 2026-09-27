import { prisma } from "../../../lib/auth";
import { calculateLevel, LEVEL_NAME } from "../constants/xpLevel";
import { calculateNewStreak } from "./gamification.service";
import { calculatePercentage, calculateStars, isPhaseUnlocked } from "./trailMapRules";
import { loadPhaseGate } from "./getTrailMap.service";
import {
  ExamReviewItem,
  GradableQuestion,
  gradeFullLesson,
  gradePhaseExam,
  toExamOptions,
} from "./phaseExam";

const TRAIL_LESSON_SOURCE = "TRAIL_LESSON";

export class PhaseLockedError extends Error {
  constructor() {
    super("Conclua a fase anterior para liberar esta.");
    this.name = "PhaseLockedError";
  }
}

function calculateTargetXp(
  xpReward: number,
  correctCount: number,
  totalQuestions: number,
): number {
  return Math.floor((xpReward * correctCount) / totalQuestions);
}

export interface ScoreLessonResult {
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  stars: number;
  xpEarned: number;
  totalXp: number;
  currentLevel: number;
  levelName: string;
  leveledUp: boolean;
  alreadyRewarded: boolean;
  currentStreak: number;
  longestStreak: number;
  /** Correção pergunta a pergunta, com a explicação — o feedback da tela de resultado. */
  review: ExamReviewItem[];
  /** @deprecated use `passed` — mantido para o cliente antigo */
  completed: boolean;
}

export async function scoreLesson(
  userId: string,
  lessonId: string,
  answers: Record<string, string>,
): Promise<ScoreLessonResult> {
  const lesson = await prisma.trailLesson.findUnique({
    where: { id: lessonId },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          statement: true,
          options: true,
          correctAnswer: true,
          explanation: true,
        },
      },
    },
  });

  if (!lesson || !lesson.isActive) {
    throw new Error("Lição não encontrada.");
  }

  if (lesson.questions.length === 0) {
    throw new Error("A lição não possui perguntas ativas.");
  }

  // O gate vale no servidor: não adianta o cliente chamar direto uma fase travada.
  const gate = await loadPhaseGate(userId, lessonId);
  if (gate && !isPhaseUnlocked(gate, lessonId)) {
    throw new PhaseLockedError();
  }

  const questions: GradableQuestion[] = lesson.questions.map((question) => ({
    ...question,
    options: toExamOptions(question.options),
  }));
  // Fases do mapa sorteiam a prova do banco; lições antigas (sem unidade)
  // continuam corrigindo todas as perguntas.
  const { correctCount, totalQuestions, review } = lesson.unitId
    ? gradePhaseExam(questions, answers)
    : gradeFullLesson(questions, answers);
  const percentage = calculatePercentage(correctCount, totalQuestions);
  const passed = percentage >= lesson.passingScore;
  const stars = calculateStars(percentage, lesson.passingScore);

  return prisma.$transaction(async (transaction) => {
    const previousProgress = await transaction.userTrailProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const progress = previousProgress
      ? await transaction.userTrailProgress.update({
          where: { id: previousProgress.id },
          data: {
            attempts: { increment: 1 },
            bestCorrect: Math.max(previousProgress.bestCorrect, correctCount),
            bestPercentage: Math.max(previousProgress.bestPercentage, percentage),
            stars: Math.max(previousProgress.stars, stars),
            // Aprovação não se perde ao tentar de novo e ir pior.
            passed: previousProgress.passed || passed,
            totalQuestions,
            completedAt: passed ? previousProgress.completedAt ?? new Date() : previousProgress.completedAt,
          },
        })
      : await transaction.userTrailProgress.create({
          data: {
            userId,
            lessonId,
            attempts: 1,
            bestCorrect: correctCount,
            bestPercentage: percentage,
            stars,
            passed,
            totalQuestions,
            completedAt: passed ? new Date() : null,
          },
        });

    // XP só por fase aprovada, e apenas o delta em relação ao que já foi pago.
    const targetXp = progress.passed
      ? calculateTargetXp(lesson.xpReward, progress.bestCorrect, totalQuestions)
      : 0;
    const earnedXp = Math.max(0, targetXp - (previousProgress?.xpAwarded ?? 0));

    if (earnedXp > 0) {
      await transaction.xpEvent.create({
        data: {
          userId,
          source: TRAIL_LESSON_SOURCE,
          referenceId: lessonId,
          amount: earnedXp,
        },
      });
      await transaction.userTrailProgress.update({
        where: { id: progress.id },
        data: { xpAwarded: targetXp },
      });
    }

    // A ofensiva conta a tentativa mesmo sem XP novo — é o que registra a
    // atividade do dia, do mesmo jeito que a revisão de conhecimento faz.
    const previousGamification = await transaction.userGamification.findUnique({
      where: { userId },
      select: {
        totalXp: true,
        currentLevel: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    const previousLevel = previousGamification?.currentLevel ?? 1;
    const totalXp = (previousGamification?.totalXp ?? 0) + earnedXp;
    const currentLevel = calculateLevel(totalXp);
    const now = new Date();
    const { newCurrentStreak, newLongestStreak } = calculateNewStreak(
      previousGamification?.lastActivityDate ?? null,
      previousGamification?.currentStreak ?? 0,
      previousGamification?.longestStreak ?? 0,
      now,
    );

    await transaction.userGamification.upsert({
      where: { userId },
      create: {
        userId,
        totalXp,
        currentLevel,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
      },
      update: {
        totalXp,
        currentLevel,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
      },
    });

    return {
      correctCount,
      totalQuestions,
      percentage,
      passingScore: lesson.passingScore,
      passed,
      stars: progress.stars,
      xpEarned: earnedXp,
      totalXp,
      currentLevel,
      levelName: LEVEL_NAME,
      leveledUp: currentLevel > previousLevel,
      alreadyRewarded: earnedXp === 0 && progress.passed,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      review,
      completed: progress.passed,
    };
  });
}
