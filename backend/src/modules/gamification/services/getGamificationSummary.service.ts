import { prisma } from "../../../lib/auth";
import { LEVEL_NAME } from "../constants/xpLevel";
import { effectiveStreak } from "./streakRules";

export interface GamificationSummary {
  totalXp: number;
  currentLevel: number;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedReviews: number;
}

export interface GamificationSummaryRepository {
  findGamification: (userId: string) => Promise<{
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  } | null>;
  countCompletedReviews: (userId: string) => Promise<number>;
}

const defaultRepository: GamificationSummaryRepository = {
  findGamification: async (userId) => {
    return prisma.userGamification.findUnique({
      where: { userId },
      select: {
        totalXp: true,
        currentLevel: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });
  },
  countCompletedReviews: async (userId) => {
    return prisma.knowledgeReviewSession.count({
      where: { userId, status: "COMPLETED" },
    });
  },
};

export async function getGamificationSummaryService(
  userId: string,
  repository: GamificationSummaryRepository = defaultRepository,
  now: Date = new Date(),
): Promise<GamificationSummary> {
  const [gamification, completedReviews] = await Promise.all([
    repository.findGamification(userId),
    repository.countCompletedReviews(userId),
  ]);

  return {
    totalXp: gamification?.totalXp ?? 0,
    currentLevel: gamification?.currentLevel ?? 1,
    levelName: LEVEL_NAME,
    // A ofensiva gravada só é zerada na próxima atividade; aqui já sai a efetiva.
    currentStreak: effectiveStreak(
      gamification?.currentStreak ?? 0,
      gamification?.lastActivityDate ?? null,
      now,
    ),
    longestStreak: gamification?.longestStreak ?? 0,
    lastActivityDate: gamification?.lastActivityDate?.toISOString() ?? null,
    completedReviews,
  };
}
