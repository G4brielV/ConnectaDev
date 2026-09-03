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

export interface QuizSubmitPayload {
  answers: Record<string, string>;
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

export async function submitQuiz(
  token: string,
  payload: QuizSubmitPayload,
): Promise<void> {
  const response = await fetch(`${API_URL}/quiz/submit`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível enviar suas respostas.",
    );
  }
}
