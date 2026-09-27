import { addDays, StudyDay, studyDayDiff, toStudyDay, weekStart } from "./studyDay";

/**
 * A ofensiva gravada só muda quando a pessoa estuda; ler o número cru faria
 * quem parou há dias continuar vendo a ofensiva antiga. Viva é quem estudou
 * hoje ou ontem.
 */
export function effectiveStreak(stored: number, lastActivityDate: Date | null, now: Date): number {
  if (!lastActivityDate || stored <= 0) return 0;
  return studyDayDiff(toStudyDay(now), toStudyDay(lastActivityDate)) <= 1 ? stored : 0;
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

export type WeekDayStatus = "done" | "pending" | "missed" | "upcoming";

export interface WeekDay {
  day: StudyDay;
  label: string;
  isToday: boolean;
  status: WeekDayStatus;
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Semana atual, de segunda a domingo. */
export function buildWeek(today: StudyDay, activeDays: ReadonlySet<StudyDay>): WeekDay[] {
  const monday = weekStart(today);
  return WEEKDAY_LABELS.map((label, index) => {
    const day = addDays(monday, index);
    const position = studyDayDiff(day, today);
    let status: WeekDayStatus;
    if (activeDays.has(day)) status = "done";
    else if (position === 0) status = "pending";
    else if (position < 0) status = "missed";
    else status = "upcoming";
    return { day, label, isToday: position === 0, status };
  });
}

export interface StreakMilestone {
  days: number;
  title: string;
  achieved: boolean;
  /** Conquistado hoje — a tela comemora com "Novo!". */
  isNew: boolean;
  /** Dias da ofensiva atual rumo ao marco (limitado ao marco). */
  progress: number;
}

const MILESTONES = [
  { days: 3, title: "Faísca" },
  { days: 7, title: "Fogo!" },
  { days: 14, title: "Hábito" },
  { days: 30, title: "Lenda" },
] as const;

export function buildMilestones(
  currentStreak: number,
  longestStreak: number,
  activeToday: boolean,
): StreakMilestone[] {
  return MILESTONES.map(({ days, title }) => {
    const achieved = Math.max(currentStreak, longestStreak) >= days;
    return {
      days,
      title,
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
