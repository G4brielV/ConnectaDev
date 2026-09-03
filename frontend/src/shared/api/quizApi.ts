import { API_URL } from "../config/api";

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

interface QuizQuestionsResponse {
  questions: QuizQuestion[];
}

export async function fetchQuizQuestions(
  token: string,
): Promise<QuizQuestion[]> {
  const response = await fetch(`${API_URL}/api/quiz/questions`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar o questionário.",
    );
  }

  const payload = (await response.json()) as QuizQuestionsResponse;
  return payload.questions;
}
