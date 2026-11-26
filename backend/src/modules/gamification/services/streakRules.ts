import { addDays, StudyDay, studyDayDiff, studyDayMidday, toStudyDay, weekStart } from "./studyDay";

export const STREAK_SHIELD_COST = 150;
export const MAX_STREAK_SHIELDS = 2;
export const STREAK_SHIELD_PURCHASE_SOURCE = "STREAK_SHIELD_PURCHASE";

export type ActivityDayKind = "STUDY" | "SHIELD";

export function availableXp(totalXp: number, xpSpent: number): number {
  return Math.max(0, totalXp - xpSpent);
}

/**
 * A ofensiva gravada só muda quando a pessoa estuda (ou reconcilia escudos);
 * ler o número cru faria quem parou há dias continuar vendo a ofensiva antiga.
 * Viva é quem estudou hoje, ontem, ou tem escudos suficientes para cobrir
 * todos os dias perdidos no intervalo.
 */
export function effectiveStreak(
  stored: number,
  lastActivityDate: Date | null,
  now: Date,
  streakShields = 0,
): number {
  if (!lastActivityDate || stored <= 0) return 0;
  const diff = studyDayDiff(toStudyDay(now), toStudyDay(lastActivityDate));
  return diff <= 1 + Math.max(0, streakShields) ? stored : 0;
}

export type ShieldGapStatus = "NONE" | "ALIVE" | "SHIELDED" | "EXPIRED";

export interface ShieldGapResolution {
  status: ShieldGapStatus;
  /** Dias perdidos que serão marcados como protegidos (vazio se não cobrir a lacuna inteira). */
  daysToShield: StudyDay[];
  /** Escudos restantes após aplicar a proteção (ou intactos se a ofensiva já expirou). */
  remainingShields: number;
  /** Âncora efetiva da última atividade/proteção para cálculo da ofensiva. */
  effectiveLastActivityDate: Date | null;
}

/**
 * Avalia se há dias perdidos entre a última atividade e hoje, e decide se os
 * escudos disponíveis cobrem a lacuna inteira. Se os escudos não forem
 * suficientes para salvar a ofensiva, eles NÃO são desperdiçados.
 */
export function resolveShieldGap(
  storedStreak: number,
  lastActivityDate: Date | null,
  streakShields: number,
  now: Date,
): ShieldGapResolution {
  const safeShields = Math.max(0, streakShields);
  if (!lastActivityDate || storedStreak <= 0) {
    return {
      status: "NONE",
      daysToShield: [],
      remainingShields: safeShields,
      effectiveLastActivityDate: lastActivityDate,
    };
  }

  const today = toStudyDay(now);
  const lastDay = toStudyDay(lastActivityDate);
  const diff = studyDayDiff(today, lastDay);

  if (diff <= 1) {
    return {
      status: "ALIVE",
      daysToShield: [],
      remainingShields: safeShields,
      effectiveLastActivityDate: lastActivityDate,
    };
  }

  const missedCount = diff - 1;
  if (safeShields >= missedCount) {
    const daysToShield = Array.from({ length: missedCount }, (_, index) =>
      addDays(lastDay, index + 1),
    );
    const lastShieldedDay = daysToShield[daysToShield.length - 1];
    return {
      status: "SHIELDED",
      daysToShield,
      remainingShields: safeShields - missedCount,
      effectiveLastActivityDate: studyDayMidday(lastShieldedDay),
    };
  }

  return {
    status: "EXPIRED",
    daysToShield: [],
    remainingShields: safeShields,
    effectiveLastActivityDate: lastActivityDate,
  };
}

/**
 * Dias da última ofensiva, reconstruídos a partir do contador. Cobre quem já
 * estudava antes do histórico existir — esses dias aconteceram de fato,
 * mesmo que a ofensiva tenha quebrado depois.
 */
export function derivedStreakDays(storedStreak: number, lastActivityDate: Date | null): StudyDay[] {
  if (!lastActivityDate || storedStreak <= 0) return [];
  const last = toStudyDay(lastActivityDate);
  return Array.from({ length: storedStreak }, (_, index) => addDays(last, index - storedStreak + 1));
}

export type WeekDayStatus = "done" | "shielded" | "pending" | "missed" | "upcoming";

export interface WeekDay {
  day: StudyDay;
  label: string;
  isToday: boolean;
  status: WeekDayStatus;
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Semana atual, de segunda a domingo. */
export function buildWeek(
  today: StudyDay,
  activeDays: ReadonlySet<StudyDay>,
  shieldedDays: ReadonlySet<StudyDay> = new Set(),
): WeekDay[] {
  const monday = weekStart(today);
  return WEEKDAY_LABELS.map((label, index) => {
    const day = addDays(monday, index);
    const position = studyDayDiff(day, today);
    let status: WeekDayStatus;
    if (activeDays.has(day)) status = "done";
    else if (shieldedDays.has(day)) status = "shielded";
    else if (position === 0) status = "pending";
    else if (position < 0) status = "missed";
    else status = "upcoming";
    return { day, label, isToday: position === 0, status };
  });
}

export interface StreakMilestone {
  days: number;
  title: string;
  /** Bônus pago na primeira vez que a ofensiva chega ao marco. */
  xp: number;
  achieved: boolean;
  /** Conquistado hoje — a tela comemora com "Novo!". */
  isNew: boolean;
  /** Dias da ofensiva atual rumo ao marco (limitado ao marco). */
  progress: number;
}

export const STREAK_MILESTONES = [
  { days: 3, title: "Faísca", xp: 10 },
  { days: 7, title: "Fogo!", xp: 30 },
  { days: 14, title: "Hábito", xp: 50 },
  { days: 30, title: "Lenda", xp: 100 },
] as const;

export function buildMilestones(
  currentStreak: number,
  longestStreak: number,
  activeToday: boolean,
): StreakMilestone[] {
  return STREAK_MILESTONES.map(({ days, title, xp }) => {
    const achieved = Math.max(currentStreak, longestStreak) >= days;
    return {
      days,
      title,
      xp,
      achieved,
      isNew: achieved && activeToday && currentStreak === days,
      progress: Math.min(currentStreak, days),
    };
  });
}

/** Selo do topo da tela, conforme o tamanho da ofensiva. */
export function streakTier(currentStreak: number): string {
  if (currentStreak >= 30) return "Lenda da Ofensiva";
  if (currentStreak >= 14) return "Hábito Formado";
  if (currentStreak >= 7) return "Fase Imparável";
  if (currentStreak >= 3) return "Pegando Fogo";
  if (currentStreak >= 1) return "Aquecendo";
  return "Hora de Começar";
}
