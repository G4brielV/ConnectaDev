import type { PhaseQuestion } from '@/shared/api/trailMapApi';

export type PhaseStage = 'study' | 'exam';

/** Só libera o envio quando todas as questões têm resposta. */
export function canSubmitExam(
  questions: PhaseQuestion[],
  answers: Record<string, string>,
): boolean {
  return questions.length > 0 && questions.every((question) => Boolean(answers[question.id]));
}

export function answeredCount(
  questions: PhaseQuestion[],
  answers: Record<string, string>,
): number {
  return questions.filter((question) => Boolean(answers[question.id])).length;
}

export function isLastQuestion(index: number, total: number): boolean {
  return total > 0 && index === total - 1;
}

/**
 * A prova avança uma pergunta por vez, então o botão principal muda de papel:
 * cobra a resposta, avança, ou finaliza na última.
 */
export function getExamButtonLabel(
  index: number,
  total: number,
  hasAnswer: boolean,
): string {
  if (!hasAnswer) return 'Selecione uma alternativa';
  return isLastQuestion(index, total) ? 'Finalizar prova' : 'Próxima pergunta';
}

/** Progresso mostrado na barra: conta a pergunta atual, não só as respondidas. */
export function examProgressPercentage(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((index + 1) / total) * 100);
}

/**
 * Índice da primeira pergunta sem resposta — para onde "Finalizar" manda o
 * usuário caso ele tenha pulado alguma voltando atrás.
 */
export function firstUnansweredIndex(
  questions: PhaseQuestion[],
  answers: Record<string, string>,
): number {
  return questions.findIndex((question) => !answers[question.id]);
}

/** Mensagem do resultado, conforme a aprovação e as estrelas. */
export function buildResultHeadline(passed: boolean, stars: number): string {
  if (!passed) return 'Quase lá!';
  if (stars >= 3) return 'Perfeito!';
  if (stars === 2) return 'Muito bem!';
  return 'Fase concluída!';
}
