import type { PhaseQuestion } from '@/shared/api/trailMapApi';
import type { ExamReviewItem } from '@/shared/api/gamificationApi';

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

/**
 * As alternativas chegam embaralhadas e mantêm o id original, então a letra
 * mostrada é a da posição na tela — senão a prova exibiria "C, A, D, B".
 */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Envia as respostas na ordem da prova, que é a ordem da correção no resultado. */
export function orderAnswers(
  questions: PhaseQuestion[],
  answers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    questions
      .filter((question) => Boolean(answers[question.id]))
      .map((question) => [question.id, answers[question.id]]),
  );
}

export function optionLabel(
  options: Array<{ id: string; label: string }>,
  optionId: string | null,
): string {
  if (!optionId) return 'Sem resposta';
  return options.find((option) => option.id === optionId)?.label ?? optionId;
}

/** O que revisar primeiro: só as perguntas erradas, na ordem da prova. */
export function reviewMistakes(review: ExamReviewItem[]): ExamReviewItem[] {
  return review.filter((item) => !item.isCorrect);
}
