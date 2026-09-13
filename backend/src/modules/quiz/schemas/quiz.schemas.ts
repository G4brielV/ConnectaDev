export type QuizQuestionType = "MULTIPLE_CHOICE" | "OPEN_TEXT";

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
  validation?: QuizValidation;
}

export interface QuizValidation {
  minLength?: number;
  maxLength?: number;
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
