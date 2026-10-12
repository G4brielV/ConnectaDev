import { STREAK_MILESTONES } from "./streakRules";

/** Gabarito: metade do XP da fase (20 → +10, baú 50 → +25, chefão 100 → +50). */
export const PERFECT_BONUS_RATE = 0.5;
/** Pago no dia em que a ofensiva sobe — manter, não começar. */
export const DAILY_STREAK_BONUS_XP = 5;
/** Acertos seguidos para o combo da prática começar a contar. */
export const COMBO_MIN = 3;

export type XpItemKind =
  | "LESSON"
  | "PRACTICE"
  | "REVIEW"
  | "PERFECT"
  | "COMBO"
  | "STREAK_DAILY"
  | "STREAK_MILESTONE";

/** Uma linha do extrato de XP que a tela de resultado mostra. */
export interface XpBreakdownItem {
  kind: XpItemKind;
  amount: number;
}

/**
 * O que a atividade fez com a ofensiva: começou do zero, subiu, recomeçou
 * depois de perder dias, ou já tinha sido garantida hoje.
 */
export type StreakStatus = "STARTED" | "INCREMENTED" | "RESTARTED" | "KEPT";

export interface StreakMilestoneReward {
  days: number;
  title: string;
  xp: number;
}

export function isPerfect(correctCount: number, totalQuestions: number): boolean {
  return totalQuestions > 0 && correctCount === totalQuestions;
}

/** Pago só na primeira vez que a fase sai gabaritada; refazer não paga de novo. */
export function perfectBonus(xpReward: number, perfect: boolean, previousBestPercentage: number): number {
  if (!perfect || previousBestPercentage >= 100) return 0;
  return Math.round(xpReward * PERFECT_BONUS_RATE);
}

/** Maior sequência de acertos seguidos, na ordem em que as perguntas apareceram. */
export function bestCombo(results: readonly boolean[]): number {
  let best = 0;
  let current = 0;
  for (const isCorrect of results) {
    current = isCorrect ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/** Combo x3 vale +3, x5 vale +5; abaixo do mínimo não vale nada. */
export function comboBonus(combo: number): number {
  return combo >= COMBO_MIN ? combo : 0;
}

export interface StreakReward {
  bonuses: XpBreakdownItem[];
  milestone: StreakMilestoneReward | null;
}

/**
 * Bônus da ofensiva no dia em que ela sobe: o diário e, se bater um marco
 * pela primeira vez (recorde anterior abaixo dele), o do marco.
 */
export function streakReward(
  status: StreakStatus,
  currentStreak: number,
  previousLongestStreak: number,
): StreakReward {
  if (status !== "INCREMENTED") return { bonuses: [], milestone: null };

  const bonuses: XpBreakdownItem[] = [{ kind: "STREAK_DAILY", amount: DAILY_STREAK_BONUS_XP }];
  const reached = STREAK_MILESTONES.find(
    ({ days }) => days === currentStreak && previousLongestStreak < days,
  );
  if (!reached) return { bonuses, milestone: null };

  bonuses.push({ kind: "STREAK_MILESTONE", amount: reached.xp });
  return { bonuses, milestone: { days: reached.days, title: reached.title, xp: reached.xp } };
}

/** Extrato de uma atividade: só entram as linhas que pagaram algo. */
export function xpBreakdown(...items: XpBreakdownItem[]): XpBreakdownItem[] {
  return items.filter((item) => item.amount > 0);
}

export function sumXp(items: readonly XpBreakdownItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}
