import { PrismaClient } from "@prisma/client";
import { calculateLevel } from "../constants/xpLevel";

export interface UpdateGamificationParams {
  userId: string;
  xpEarned: number;
  activityDate?: Date;
}

export interface GamificationResult {
  totalXp: number;
  currentLevel: number;
  xpEarned: number;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
}

/**
 * Normalizes date to UTC YYYY-MM-DD string for comparison.
 */
export function getUtcDayString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculates day difference between two dates (dateA - dateB) in calendar days (UTC).
 */
export function getDayDifference(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateA.getUTCFullYear(), dateA.getUTCMonth(), dateA.getUTCDate());
  const utcB = Date.UTC(dateB.getUTCFullYear(), dateB.getUTCMonth(), dateB.getUTCDate());
  return Math.floor((utcA - utcB) / msPerDay);
}

export function calculateNewStreak(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date(),
): { newCurrentStreak: number; newLongestStreak: number; streakIncremented: boolean } {
  if (!lastActivityDate) {
    return {
      newCurrentStreak: 1,
      newLongestStreak: Math.max(1, longestStreak),
      streakIncremented: true,
    };
  }

  const dayDiff = getDayDifference(now, lastActivityDate);

  if (dayDiff === 0) {
    // Activity already performed today, keep current streak
    return {
      newCurrentStreak: currentStreak,
      newLongestStreak: longestStreak,
      streakIncremented: false,
    };
  }

  if (dayDiff === 1) {
    // Consecutively yesterday -> streak increments
    const newCurrent = currentStreak + 1;
    return {
      newCurrentStreak: newCurrent,
      newLongestStreak: Math.max(newCurrent, longestStreak),
      streakIncremented: true,
    };
  }

  // Missed at least one day -> streak resets to 1
  return {
    newCurrentStreak: 1,
    newLongestStreak: Math.max(1, longestStreak),
    streakIncremented: true,
  };
}

export async function awardGamificationPoints(
  prisma: PrismaClient,
  params: UpdateGamificationParams,
): Promise<GamificationResult> {
  const { userId, xpEarned, activityDate = new Date() } = params;

  const currentGamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  const existingStreak = currentGamification?.currentStreak ?? 0;
  const existingLongest = currentGamification?.longestStreak ?? 0;
  const existingXp = currentGamification?.totalXp ?? 0;
  const lastActivity = currentGamification?.lastActivityDate ?? null;

  const { newCurrentStreak, newLongestStreak, streakIncremented } = calculateNewStreak(
    lastActivity,
    existingStreak,
    existingLongest,
    activityDate,
  );

  const updatedXp = existingXp + xpEarned;
  const updatedLevel = calculateLevel(updatedXp);

  const saved = await prisma.userGamification.upsert({
    where: { userId },
    update: {
      totalXp: updatedXp,
      currentLevel: updatedLevel,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: activityDate,
    },
    create: {
      userId,
      totalXp: updatedXp,
      currentLevel: updatedLevel,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: activityDate,
    },
  });

  return {
    totalXp: saved.totalXp,
    currentLevel: saved.currentLevel,
    xpEarned,
    currentStreak: saved.currentStreak,
    longestStreak: saved.longestStreak,
    streakIncremented,
  };
}
