import { prisma } from "../../../lib/auth";
import { calculateLevel, LEVEL_NAME } from "../constants/xpLevel";

const TRAIL_LESSON_SOURCE = "TRAIL_LESSON";

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
  xpEarned: number;
  totalXp: number;
  currentLevel: number;
  levelName: string;
  leveledUp: boolean;
  alreadyRewarded: boolean;
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
        select: { id: true, correctAnswer: true },
      },
    },
  });

  if (!lesson || !lesson.isActive) {
    throw new Error("Lição não encontrada.");
  }

  if (lesson.questions.length === 0) {
    throw new Error("A lição não possui perguntas ativas.");
  }

  const correctCount = lesson.questions.filter(
    (question) => answers[question.id] === question.correctAnswer,
  ).length;
  const totalQuestions = lesson.questions.length;
  const completed = lesson.questions.every(
    (question) => typeof answers[question.id] === "string" && answers[question.id].trim().length > 0,
  );

  console.log(
    `[gamification] Pontuação recebida: user=${userId}, lesson=${lessonId}, correct=${correctCount}/${totalQuestions}, completed=${completed}`,
  );

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
            totalQuestions,
            completedAt: completed
              ? previousProgress.completedAt ?? new Date()
              : previousProgress.completedAt,
          },
        })
      : await transaction.userTrailProgress.create({
          data: {
            userId,
            lessonId,
            attempts: 1,
            bestCorrect: correctCount,
            totalQuestions,
            completedAt: completed ? new Date() : null,
          },
        });

    const targetXp = completed
      ? calculateTargetXp(lesson.xpReward, correctCount, totalQuestions)
      : progress.xpAwarded;
    const earnedXp = Math.max(0, targetXp - progress.xpAwarded);
    console.log(
      `[gamification] XP calculado: user=${userId}, lesson=${lessonId}, target=${targetXp}, alreadyAwarded=${progress.xpAwarded}, earned=${earnedXp}`,
    );
    if (earnedXp === 0) {
      const gamification = await transaction.userGamification.findUnique({
        where: { userId },
        select: { totalXp: true, currentLevel: true },
      });
      const totalXp = gamification?.totalXp ?? 0;
      const currentLevel = gamification?.currentLevel ?? 1;

      return {
        correctCount,
        totalQuestions,
        xpEarned: 0,
        totalXp,
        currentLevel,
        levelName: LEVEL_NAME,
        leveledUp: false,
        alreadyRewarded: targetXp <= progress.xpAwarded,
        completed: Boolean(progress.completedAt),
      };
    }

    await transaction.xpEvent.create({
      data: {
        userId,
        source: TRAIL_LESSON_SOURCE,
        referenceId: lessonId,
        amount: earnedXp,
      },
    });
    console.log(
      `[gamification] Evento XP criado: user=${userId}, source=${TRAIL_LESSON_SOURCE}, reference=${lessonId}, amount=${earnedXp}`,
    );

    const previousGamification = await transaction.userGamification.findUnique({
      where: { userId },
      select: { totalXp: true, currentLevel: true },
    });
    const previousLevel = previousGamification?.currentLevel ?? 1;
    const previousTotalXp = previousGamification?.totalXp ?? 0;
    const totalXp = previousTotalXp + earnedXp;
    const currentLevel = calculateLevel(totalXp);

    await transaction.userGamification.upsert({
      where: { userId },
      create: { userId, totalXp, currentLevel },
      update: { totalXp, currentLevel },
    });
    console.log(
      `[gamification] Saldo atualizado: user=${userId}, totalXp=${totalXp}, level=${currentLevel}`,
    );

    await transaction.userTrailProgress.update({
      where: { id: progress.id },
      data: { xpAwarded: targetXp },
    });
    console.log(
      `[gamification] Progresso atualizado: user=${userId}, lesson=${lessonId}, xpAwarded=${targetXp}`,
    );

    return {
      correctCount,
      totalQuestions,
      xpEarned: earnedXp,
      totalXp,
      currentLevel,
      levelName: LEVEL_NAME,
      leveledUp: currentLevel > previousLevel,
      alreadyRewarded: false,
      completed: true,
    };
  });
}
