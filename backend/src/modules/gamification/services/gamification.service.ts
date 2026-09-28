import { Prisma, PrismaClient } from "@prisma/client";
import { calculateLevel } from "../constants/xpLevel";
import { studyDayDiff, studyDayToDate, toStudyDay } from "./studyDay";

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
 * Calculates day difference between two dates (dateA - dateB) in calendar
 * days of Recife — see `studyDay.ts` for why the day doesn't turn over in UTC.
 */
export function getDayDifference(dateA: Date, dateB: Date): number {
  return studyDayDiff(toStudyDay(dateA), toStudyDay(dateB));
}

type ActivityDayClient = Pick<PrismaClient, "userActivityDay"> | Prisma.TransactionClient;

/**
 * Marks the study day in the streak history. Called wherever the streak is
 * updated; repeated activity on the same day is a no-op.
 */
export async function recordActivityDay(
  client: ActivityDayClient,
  userId: string,
  date: Date,
): Promise<void> {
  await client.userActivityDay.createMany({
    data: [{ userId, day: studyDayToDate(toStudyDay(date)) }],
    skipDuplicates: true,
  });
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

export interface StudyActivityResult {
  totalXp: number;
  currentLevel: number;
  previousLevel: number;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
}

/**
 * Soma o XP e registra o dia de estudo dentro de uma transação já aberta.
 * Conta a ofensiva mesmo com 0 XP: estudar é o que mantém o fogo aceso.
 */
export async function applyStudyActivity(
  transaction: Prisma.TransactionClient,
  userId: string,
  earnedXp: number,
  now: Date = new Date(),
): Promise<StudyActivityResult> {
  const previous = await transaction.userGamification.findUnique({
    where: { userId },
    select: {
      totalXp: true,
      currentLevel: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
    },
  });

  const previousLevel = previous?.currentLevel ?? 1;
  const totalXp = (previous?.totalXp ?? 0) + earnedXp;
  const currentLevel = calculateLevel(totalXp);
  const { newCurrentStreak, newLongestStreak, streakIncremented } = calculateNewStreak(
    previous?.lastActivityDate ?? null,
    previous?.currentStreak ?? 0,
    previous?.longestStreak ?? 0,
    now,
  );

  const data = {
    totalXp,
    currentLevel,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: now,
  };
  await transaction.userGamification.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  await recordActivityDay(transaction, userId, now);

  return {
    totalXp,
    currentLevel,
    previousLevel,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    streakIncremented,
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
  await recordActivityDay(prisma, userId, activityDate);

  return {
    totalXp: saved.totalXp,
    currentLevel: saved.currentLevel,
    xpEarned,
    currentStreak: saved.currentStreak,
    longestStreak: saved.longestStreak,
    streakIncremented,
  };
}
