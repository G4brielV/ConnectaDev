import { QuestionResultItem, ReviewOption, ReviewQuestion } from "../shared/api/reviewApi";

export type OptionStatus = "default" | "selected" | "correct" | "incorrect" | "dimmed";

export function getOptionStatus(
  option: ReviewOption,
  selectedOptionId: string | null,
  isConfirmed: boolean,
  correctOptionId: string,
): OptionStatus {
  if (!isConfirmed) {
    return option.id === selectedOptionId ? "selected" : "default";
  }

  if (option.id === correctOptionId) {
    return "correct";
  }

  if (option.id === selectedOptionId) {
    return "incorrect";
  }

  return "dimmed";
}

export interface ReviewButtonState {
  label: string;
  disabled: boolean;
  canAdvance: boolean;
  hint: string | null;
}

export function getReviewButtonState(
  selectedOptionId: string | null,
  isConfirmed: boolean,
  isLastQuestion: boolean,
): ReviewButtonState {
  if (!isConfirmed) {
    const hasSelection = Boolean(selectedOptionId);
    return {
      label: "Confirmar Resposta",
      disabled: !hasSelection,
      canAdvance: false,
      hint: !hasSelection ? "Selecione uma alternativa antes de continuar" : null,
    };
  }

  return {
    label: isLastQuestion ? "Finalizar Revisão" : "Próxima Pergunta",
    disabled: false,
    canAdvance: true,
    hint: null,
  };
}

export function getWrongAnswers(results: QuestionResultItem[]): QuestionResultItem[] {
  return results.filter((result) => !result.isCorrect);
}
