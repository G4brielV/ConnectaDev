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
