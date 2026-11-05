import { prisma } from "../../../lib/auth";
import {
  addDays,
  monthOf,
  monthRange,
  StudyDay,
  studyDayToDate,
  toStudyDay,
  weekStart,
} from "./studyDay";
import {
  buildMilestones,
  buildWeek,
  derivedStreakDays,
  effectiveStreak,
  StreakMilestone,
  streakTier,
  WeekDay,
} from "./streakRules";

export interface StreakOverview {
  currentStreak: number;
  longestStreak: number;
  /** Hoje, no dia de estudo de Recife (YYYY-MM-DD). */
  today: StudyDay;
  activeToday: boolean;
  /** Ofensiva viva, mas ainda sem estudo hoje: perde se o dia virar. */
  atRisk: boolean;
  tier: string;
  week: WeekDay[];
  month: {
    month: string;
    isCurrent: boolean;
    activeDays: StudyDay[];
  };
  milestones: StreakMilestone[];
}

export interface StreakRepository {
  findGamification: (userId: string) => Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  } | null>;
  findActivityDays: (userId: string, from: StudyDay, to: StudyDay) => Promise<StudyDay[]>;
}

export class InvalidStreakMonthError extends Error {
  constructor() {
    super("Mês inválido para o calendário da ofensiva.");
    this.name = "InvalidStreakMonthError";
  }
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const defaultRepository: StreakRepository = {
  findGamification: (userId) =>
    prisma.userGamification.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
    }),
  findActivityDays: async (userId, from, to) => {
    const rows = await prisma.userActivityDay.findMany({
      where: { userId, day: { gte: studyDayToDate(from), lte: studyDayToDate(to) } },
      select: { day: true },
    });
    return rows.map((row) => row.day.toISOString().slice(0, 10));
  },
};

export async function getStreakOverview(
  userId: string,
  month?: string,
  repository: StreakRepository = defaultRepository,
  now: Date = new Date(),
): Promise<StreakOverview> {
  const today = toStudyDay(now);
  const currentMonth = monthOf(today);
  const targetMonth = month ?? currentMonth;

  // O calendário só vai até o mês atual; o futuro não tem o que mostrar.
  if (!MONTH_PATTERN.test(targetMonth) || targetMonth > currentMonth) {
    throw new InvalidStreakMonthError();
  }

  const { first, last } = monthRange(targetMonth);
  const monday = weekStart(today);
  const [gamification, monthDays, weekDays] = await Promise.all([
    repository.findGamification(userId),
    repository.findActivityDays(userId, first, last),
    repository.findActivityDays(userId, monday, addDays(monday, 6)),
  ]);

  const storedStreak = gamification?.currentStreak ?? 0;
  const lastActivityDate = gamification?.lastActivityDate ?? null;
  const history = new Set<StudyDay>([
    ...monthDays,
    ...weekDays,
    ...derivedStreakDays(storedStreak, lastActivityDate),
  ]);

  const currentStreak = effectiveStreak(storedStreak, lastActivityDate, now);
  const longestStreak = Math.max(gamification?.longestStreak ?? 0, currentStreak);
  const activeToday = history.has(today);

  return {
    currentStreak,
    longestStreak,
    today,
    activeToday,
    atRisk: currentStreak > 0 && !activeToday,
    tier: streakTier(currentStreak),
    week: buildWeek(today, history),
    month: {
      month: targetMonth,
      isCurrent: targetMonth === currentMonth,
      activeDays: [...history].filter((day) => day >= first && day <= last).sort(),
    },
    milestones: buildMilestones(currentStreak, longestStreak, activeToday),
  };
}
