import type { DailyPracticeResult, PracticeAnswerResult } from '@/shared/api/practiceApi';

export type PracticeStage = 'loading' | 'question' | 'summary';

interface ButtonState {
  hasSelection: boolean;
  /** A correção desta pergunta já chegou do servidor. */
  hasFeedback: boolean;
  isLast: boolean;
}

/**
 * Fluxo de cada pergunta: escolhe, verifica, vê a correção e segue. O botão
 * principal acompanha a etapa.
 */
export function practiceButtonLabel({ hasSelection, hasFeedback, isLast }: ButtonState): string {
  if (!hasFeedback) return hasSelection ? 'Verificar' : 'Selecione uma alternativa';
  return isLast ? 'Ver resultado' : 'Continuar';
}

/** A barra enche conforme as respostas são verificadas, não ao abrir a pergunta. */
export function practiceProgressPercentage(index: number, total: number, answered: boolean): number {
  if (total <= 0) return 0;
  return Math.round(((index + (answered ? 1 : 0)) / total) * 100);
}

export function practiceHeadline(correctCount: number, totalQuestions: number): string {
  if (totalQuestions > 0 && correctCount === totalQuestions) return 'Perfeito!';
  if (correctCount / Math.max(totalQuestions, 1) >= 0.6) return 'Mandou bem!';
  if (correctCount > 0) return 'Bom treino!';
  return 'Todo erro ensina!';
}

/**
 * Explica o XP da prática no resultado — inclusive por que um treino livre
 * não pagou nada. Os bônus aparecem no extrato, não aqui.
 */
export function practiceRewardMessage(
  result: Pick<DailyPracticeResult, 'rewarded' | 'xpBreakdown'>,
): string {
  if (!result.rewarded) return 'Treino livre: o XP da prática de hoje já tinha sido garantido.';
  const practiceXp = result.xpBreakdown.find((item) => item.kind === 'PRACTICE')?.amount ?? 0;
  if (practiceXp > 0) return `+${practiceXp} XP garantidos na prática de hoje.`;
  return 'Sem acertos desta vez. Amanhã tem outra prática valendo XP.';
}

/** Acertos seguidos para o combo aparecer — o mesmo mínimo que o servidor paga. */
export const COMBO_MIN = 3;

/** Acertos seguidos até a última pergunta corrigida; um erro zera. */
export function currentCombo(results: readonly boolean[]): number {
  let combo = 0;
  for (const isCorrect of results) combo = isCorrect ? combo + 1 : 0;
  return combo;
}

/** "Combo x3! 🔥" a partir do mínimo; abaixo dele, nada na tela. */
export function comboLabel(combo: number): string | null {
  return combo >= COMBO_MIN ? `Combo x${combo}! 🔥` : null;
}

export type OptionTone = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

/**
 * Como cada alternativa aparece. Depois da correção, a certa fica verde, a
 * escolhida errada fica vermelha e o resto apaga — vale a resposta que o
 * servidor gravou, não a marcada na tela.
 */
export function optionTone(
  optionId: string,
  selectedOptionId: string | null,
  feedback: Pick<PracticeAnswerResult, 'selectedOptionId' | 'correctOptionId'> | null,
): OptionTone {
  if (!feedback) return optionId === selectedOptionId ? 'selected' : 'idle';
  if (optionId === feedback.correctOptionId) return 'correct';
  if (optionId === feedback.selectedOptionId) return 'wrong';
  return 'dimmed';
}
