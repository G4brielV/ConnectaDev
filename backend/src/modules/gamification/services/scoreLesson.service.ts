import { prisma } from "../../../lib/auth";
import { LEVEL_NAME } from "../constants/xpLevel";
import { applyStudyActivity } from "./gamification.service";
import {
  isPerfect,
  perfectBonus,
  StreakMilestoneReward,
  StreakStatus,
  sumXp,
  XpBreakdownItem,
  xpBreakdown,
} from "./bonusRules";
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
const TRAIL_LESSON_PERFECT_SOURCE = "TRAIL_LESSON_PERFECT";

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
  /** Acertou todas nesta tentativa — o selo "Perfeito!", mesmo que o bônus já tenha sido pago. */
  perfect: boolean;
  /** Total ganho nesta tentativa, bônus inclusos; o detalhe está em `xpBreakdown`. */
  xpEarned: number;
  xpBreakdown: XpBreakdownItem[];
  totalXp: number;
  currentLevel: number;
  levelName: string;
  leveledUp: boolean;
  alreadyRewarded: boolean;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  /** Marco da ofensiva batido hoje com esta tentativa — a tela comemora. */
  streakMilestone: StreakMilestoneReward | null;
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
  const perfect = isPerfect(correctCount, totalQuestions);

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

    // Bônus de gabarito: só na primeira vez que a fase sai com 100%.
    const perfectXp = perfectBonus(lesson.xpReward, perfect, previousProgress?.bestPercentage ?? 0);
    if (perfectXp > 0) {
      await transaction.xpEvent.create({
        data: {
          userId,
          source: TRAIL_LESSON_PERFECT_SOURCE,
          referenceId: lessonId,
          amount: perfectXp,
        },
      });
    }

    // A ofensiva conta a tentativa mesmo sem XP novo — é o que registra a
    // atividade do dia, do mesmo jeito que a revisão de conhecimento faz.
    const activity = await applyStudyActivity(transaction, userId, earnedXp + perfectXp);
    const breakdown = xpBreakdown(
      { kind: "LESSON", amount: earnedXp },
      { kind: "PERFECT", amount: perfectXp },
      ...activity.bonuses,
    );

    return {
      correctCount,
      totalQuestions,
      percentage,
      passingScore: lesson.passingScore,
      passed,
      stars: progress.stars,
      perfect,
      xpEarned: sumXp(breakdown),
      xpBreakdown: breakdown,
      totalXp: activity.totalXp,
      currentLevel: activity.currentLevel,
      levelName: LEVEL_NAME,
      leveledUp: activity.currentLevel > activity.previousLevel,
      alreadyRewarded: earnedXp === 0 && progress.passed,
      currentStreak: activity.currentStreak,
      longestStreak: activity.longestStreak,
      streakStatus: activity.streakStatus,
      streakMilestone: activity.milestone,
      review,
      completed: progress.passed,
    };
  });
}
