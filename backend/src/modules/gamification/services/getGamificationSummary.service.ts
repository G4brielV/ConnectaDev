import { prisma } from "../../../lib/auth";

export interface GamificationSummary {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedReviews: number;
}

export interface GamificationSummaryRepository {
  findGamification: (userId: string) => Promise<{
    xp: number;
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
      select: { xp: true, currentStreak: true, longestStreak: true, lastActivityDate: true },
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
): Promise<GamificationSummary> {
  const [gamification, completedReviews] = await Promise.all([
    repository.findGamification(userId),
    repository.countCompletedReviews(userId),
  ]);

  return {
    xp: gamification?.xp ?? 0,
    currentStreak: gamification?.currentStreak ?? 0,
    longestStreak: gamification?.longestStreak ?? 0,
    lastActivityDate: gamification?.lastActivityDate?.toISOString() ?? null,
    completedReviews,
  };
}
