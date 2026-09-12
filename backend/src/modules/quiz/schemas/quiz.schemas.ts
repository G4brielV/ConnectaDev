export type QuizQuestionType = "open" | "multiple-choice";

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  statement: string;
  type: QuizQuestionType;
  sequence: number;
  isActive: boolean;
  options?: QuizOption[];
}

export interface QuizSubmitRequest {
  answers: Record<string, string>;
}

export interface QuizAnalysisResult {
  areaPrincipal: string;
  areasSecundarias: string[];
  justificativa: string;
  tecnologiasSugeridas: string[];
}
