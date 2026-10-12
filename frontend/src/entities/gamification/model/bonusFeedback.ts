import type {
  StreakMilestoneReward,
  StreakStatus,
  XpBreakdownItem,
  XpItemKind,
} from '@/shared/api/gamificationApi';

const XP_ITEM_LABELS: Record<XpItemKind, string> = {
  LESSON: 'XP da Lição',
  PRACTICE: 'XP da Prática',
  REVIEW: 'XP da Revisão',
  PERFECT: 'Bônus Gabarito',
  COMBO: 'Bônus Combo',
  STREAK_DAILY: 'Bônus de Ofensiva',
  STREAK_MILESTONE: 'Marco de Ofensiva',
};

export function xpItemLabel(kind: XpItemKind): string {
  return XP_ITEM_LABELS[kind];
}

export function totalXpOf(items: readonly XpBreakdownItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function xpAmountOf(items: readonly XpBreakdownItem[], kind: XpItemKind): number {
  return items.find((item) => item.kind === kind)?.amount ?? 0;
}

/**
 * Frase da ofensiva no resultado. Quem manteve a chama vê o bônus do dia;
 * quem já estudou hoje sabe que não precisa de mais nada para garantir.
 */
export function streakFeedback(
  status: StreakStatus,
  currentStreak: number,
  items: readonly XpBreakdownItem[],
): string {
  switch (status) {
    case 'INCREMENTED': {
      const bonus = xpAmountOf(items, 'STREAK_DAILY');
      const base = `Chama acesa! 🔥 ${currentStreak} dias seguidos de foco!`;
      return bonus > 0 ? `${base} +${bonus} XP de bônus diário` : base;
    }
    case 'KEPT':
      return 'Ofensiva do dia já garantida! 🔥';
    case 'RESTARTED':
      return 'Que bom ter você de volta! Você reacendeu sua chama de estudos: Dia 1 🔥. Estude amanhã para continuar sua sequência!';
    case 'STARTED':
      return 'Sua chama de estudos acendeu: Dia 1 🔥. Estude amanhã para começar uma sequência!';
  }
}

const MILESTONE_HEADLINES: Record<number, string> = {
  3: 'Faísca acesa! 🔥',
  7: 'Uma semana em chamas! 🔥',
  14: 'Duas semanas de hábito! 🔥',
  30: 'Lenda da ofensiva! 🔥',
};

export function milestoneHeadline(milestone: StreakMilestoneReward): string {
  return MILESTONE_HEADLINES[milestone.days] ?? `${milestone.days} dias em chamas! 🔥`;
}

export function milestoneMessage(milestone: StreakMilestoneReward): string {
  return `Você completou ${milestone.days} dias seguidos de estudos e ganhou +${milestone.xp} XP de bonificação especial!`;
}
