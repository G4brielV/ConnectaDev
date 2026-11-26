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
  ActivityDayKind,
  availableXp,
  buildMilestones,
  buildWeek,
  derivedStreakDays,
  effectiveStreak,
  MAX_STREAK_SHIELDS,
  STREAK_SHIELD_COST,
  StreakMilestone,
  streakTier,
  WeekDay,
} from "./streakRules";
import { reconcileStreakShields } from "./streakShield.service";

export interface StreakShieldStatus {
  count: number;
  max: number;
  cost: number;
  availableXp: number;
}

export interface StreakOverview {
  currentStreak: number;
  longestStreak: number;
  /** Hoje, no dia de estudo de Recife (YYYY-MM-DD). */
  today: StudyDay;
  activeToday: boolean;
  /** Ofensiva viva, mas ainda sem estudo hoje: perde se o dia virar sem escudo. */
  atRisk: boolean;
  tier: string;
  shield: StreakShieldStatus;
  week: WeekDay[];
  month: {
    month: string;
    isCurrent: boolean;
    activeDays: StudyDay[];
    shieldedDays: StudyDay[];
  };
  milestones: StreakMilestone[];
}

export type ActivityDayRecord = StudyDay | { day: StudyDay; kind: ActivityDayKind };

export interface StreakRepository {
  reconcileShields?: (userId: string, now: Date) => Promise<void>;
  findGamification: (userId: string) => Promise<{
    totalXp?: number;
    xpSpent?: number;
    currentStreak: number;
    longestStreak: number;
    streakShields?: number;
    lastActivityDate: Date | null;
  } | null>;
  findActivityDays: (userId: string, from: StudyDay, to: StudyDay) => Promise<ActivityDayRecord[]>;
}

export class InvalidStreakMonthError extends Error {
  constructor() {
    super("Mês inválido para o calendário da ofensiva.");
    this.name = "InvalidStreakMonthError";
  }
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function normalizeActivityRecord(record: ActivityDayRecord): { day: StudyDay; kind: ActivityDayKind } {
  if (typeof record === "string") {
    return { day: record, kind: "STUDY" };
  }
  return record;
}

const defaultRepository: StreakRepository = {
  reconcileShields: (userId, now) => reconcileStreakShields(userId, now),
  findGamification: (userId) =>
    prisma.userGamification.findUnique({
      where: { userId },
      select: {
        totalXp: true,
        xpSpent: true,
        currentStreak: true,
        longestStreak: true,
        streakShields: true,
        lastActivityDate: true,
      },
    }),
  findActivityDays: async (userId, from, to) => {
    const rows = await prisma.userActivityDay.findMany({
      where: { userId, day: { gte: studyDayToDate(from), lte: studyDayToDate(to) } },
      select: { day: true, kind: true },
    });
    return rows.map((row) => ({
      day: row.day.toISOString().slice(0, 10),
      kind: row.kind === "SHIELD" ? "SHIELD" : "STUDY",
    }));
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

  if (repository.reconcileShields) {
    await repository.reconcileShields(userId, now);
  }

  const { first, last } = monthRange(targetMonth);
  const monday = weekStart(today);
  const [gamification, monthRecords, weekRecords] = await Promise.all([
    repository.findGamification(userId),
    repository.findActivityDays(userId, first, last),
    repository.findActivityDays(userId, monday, addDays(monday, 6)),
  ]);

  const storedStreak = gamification?.currentStreak ?? 0;
  const lastActivityDate = gamification?.lastActivityDate ?? null;
  const storedShields = gamification?.streakShields ?? 0;
  const totalXp = gamification?.totalXp ?? 0;
  const xpSpent = gamification?.xpSpent ?? 0;

  const shieldedDays = new Set<StudyDay>();
  const studiedDays = new Set<StudyDay>();

  for (const raw of [...monthRecords, ...weekRecords]) {
    const record = normalizeActivityRecord(raw);
    if (record.kind === "SHIELD") {
      shieldedDays.add(record.day);
    } else {
      studiedDays.add(record.day);
    }
  }

  for (const derivedDay of derivedStreakDays(storedStreak, lastActivityDate)) {
    if (!shieldedDays.has(derivedDay)) {
      studiedDays.add(derivedDay);
    }
  }

  const currentStreak = effectiveStreak(storedStreak, lastActivityDate, now, storedShields);
  const longestStreak = Math.max(gamification?.longestStreak ?? 0, currentStreak);
  const activeToday = studiedDays.has(today);

  return {
    currentStreak,
    longestStreak,
    today,
    activeToday,
    atRisk: currentStreak > 0 && !activeToday,
    tier: streakTier(currentStreak),
    shield: {
      count: storedShields,
      max: MAX_STREAK_SHIELDS,
      cost: STREAK_SHIELD_COST,
      availableXp: availableXp(totalXp, xpSpent),
    },
    week: buildWeek(today, studiedDays, shieldedDays),
    month: {
      month: targetMonth,
      isCurrent: targetMonth === currentMonth,
      activeDays: [...studiedDays].filter((day) => day >= first && day <= last).sort(),
      shieldedDays: [...shieldedDays].filter((day) => day >= first && day <= last).sort(),
    },
    milestones: buildMilestones(currentStreak, longestStreak, activeToday),
  };
}
