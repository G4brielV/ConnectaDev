export type QuizQuestionType = "open" | "multiple-choice";

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: QuizOption[];
}

export interface QuizQuestionsResponse {
  questions: QuizQuestion[];
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
