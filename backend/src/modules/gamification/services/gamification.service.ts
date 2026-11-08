import { Prisma, PrismaClient } from "@prisma/client";
import { calculateLevel } from "../constants/xpLevel";
import { StreakMilestoneReward, StreakStatus, streakReward, sumXp, XpBreakdownItem } from "./bonusRules";
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
  streakStatus: StreakStatus;
  /** Bônus da ofensiva pagos nesta atividade (diário e marco). */
  bonuses: XpBreakdownItem[];
  milestone: StreakMilestoneReward | null;
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
 * updated; repeated activity on the same day is a no-op. Returns whether this
 * was the first activity of the day — the unique (user, day) makes it the
 * guard against paying the daily bonus twice on concurrent submissions.
 */
export async function recordActivityDay(
  client: ActivityDayClient,
  userId: string,
  date: Date,
): Promise<boolean> {
  const { count } = await client.userActivityDay.createMany({
    data: [{ userId, day: studyDayToDate(toStudyDay(date)) }],
    skipDuplicates: true,
  });
  return count > 0;
}

export interface NewStreak {
  newCurrentStreak: number;
  newLongestStreak: number;
  streakIncremented: boolean;
  status: StreakStatus;
}

export function calculateNewStreak(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date(),
): NewStreak {
  if (!lastActivityDate) {
    return {
      newCurrentStreak: 1,
      newLongestStreak: Math.max(1, longestStreak),
      streakIncremented: true,
      status: "STARTED",
    };
  }

  const dayDiff = getDayDifference(now, lastActivityDate);

  if (dayDiff === 0) {
    // Activity already performed today, keep current streak
    return {
      newCurrentStreak: currentStreak,
      newLongestStreak: longestStreak,
      streakIncremented: false,
      status: "KEPT",
    };
  }

  if (dayDiff === 1) {
    // Consecutively yesterday -> streak increments
    const newCurrent = currentStreak + 1;
    return {
      newCurrentStreak: newCurrent,
      newLongestStreak: Math.max(newCurrent, longestStreak),
      streakIncremented: true,
      status: "INCREMENTED",
    };
  }

  // Missed at least one day -> streak resets to 1
  return {
    newCurrentStreak: 1,
    newLongestStreak: Math.max(1, longestStreak),
    streakIncremented: true,
    status: "RESTARTED",
  };
}

export interface StudyActivityResult {
  totalXp: number;
  currentLevel: number;
  previousLevel: number;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
  streakStatus: StreakStatus;
  /** Bônus da ofensiva pagos nesta atividade (diário e marco), já somados ao totalXp. */
  bonuses: XpBreakdownItem[];
  milestone: StreakMilestoneReward | null;
}

/**
 * Soma o XP e registra o dia de estudo dentro de uma transação já aberta.
 * Conta a ofensiva mesmo com 0 XP: estudar é o que mantém o fogo aceso. A
 * primeira atividade do dia que faz a ofensiva subir leva o bônus diário (e o
 * do marco, se bater um) — seja fase, prática ou revisão.
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
  const previousLongest = previous?.longestStreak ?? 0;
  const streak = calculateNewStreak(
    previous?.lastActivityDate ?? null,
    previous?.currentStreak ?? 0,
    previousLongest,
    now,
  );

  const firstActivityToday = await recordActivityDay(transaction, userId, now);
  const { bonuses, milestone } = firstActivityToday
    ? streakReward(streak.status, streak.newCurrentStreak, previousLongest)
    : { bonuses: [], milestone: null };

  for (const bonus of bonuses) {
    await transaction.xpEvent.create({
      data: {
        userId,
        // STREAK_DAILY / STREAK_MILESTONE: o tipo do bônus é a origem do evento.
        source: bonus.kind,
        // Diário: o dia de estudo. Marco: os dias do marco, pago uma vez na vida.
        referenceId:
          milestone && bonus.kind === "STREAK_MILESTONE" ? String(milestone.days) : toStudyDay(now),
        amount: bonus.amount,
      },
    });
  }

  const totalXp = (previous?.totalXp ?? 0) + earnedXp + sumXp(bonuses);
  const currentLevel = calculateLevel(totalXp);
  const data = {
    totalXp,
    currentLevel,
    currentStreak: streak.newCurrentStreak,
    longestStreak: streak.newLongestStreak,
    lastActivityDate: now,
  };
  await transaction.userGamification.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return {
    totalXp,
    currentLevel,
    previousLevel,
    currentStreak: streak.newCurrentStreak,
    longestStreak: streak.newLongestStreak,
    streakIncremented: streak.streakIncremented,
    streakStatus: streak.status,
    bonuses,
    milestone,
  };
}

/**
 * Entrada da revisão de conhecimento: o mesmo caminho das fases e da prática,
 * para a revisão também acender a chama com bônus.
 */
export async function awardGamificationPoints(
  prisma: PrismaClient,
  params: UpdateGamificationParams,
): Promise<GamificationResult> {
  const { userId, xpEarned, activityDate = new Date() } = params;

  const activity = await prisma.$transaction((transaction) =>
    applyStudyActivity(transaction, userId, xpEarned, activityDate),
  );

  return {
    totalXp: activity.totalXp,
    currentLevel: activity.currentLevel,
    xpEarned,
    currentStreak: activity.currentStreak,
    longestStreak: activity.longestStreak,
    streakIncremented: activity.streakIncremented,
    streakStatus: activity.streakStatus,
    bonuses: activity.bonuses,
    milestone: activity.milestone,
  };
}
