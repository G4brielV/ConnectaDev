import { API_URL } from "../config/api";

export type QuizQuestionType = "MULTIPLE_CHOICE" | "OPEN_TEXT";

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  sequence: number;
  isActive: boolean;
  options?: QuizOption[];
  validation?: QuizValidation;
}

export interface QuizValidation {
  minLength?: number;
  maxLength?: number;
}

interface QuizQuestionRecord {
  id: string;
  statement: string;
  type: QuizQuestionType | "multiple-choice" | "open";
  sequence: number;
  isActive: boolean;
  options?: QuizOption[];
  validation?: QuizValidation;
}

export interface QuizSubmitPayload {
  answers: Record<string, string>;
}

export interface QuizAnalysisResult {
  areaPrincipal: string;
  areasSecundarias: string[];
  justificativa: string;
  tecnologiasSugeridas: string[];
}

export async function fetchQuizQuestions(
  token: string,
): Promise<QuizQuestion[]> {
  const response = await fetch(`${API_URL}/quiz/questions`, {
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

  const payload = (await response.json()) as QuizQuestionRecord[];
  return payload.map((question) => ({
    id: question.id,
    type:
      question.type === "multiple-choice"
        ? "MULTIPLE_CHOICE"
        : question.type === "open"
          ? "OPEN_TEXT"
          : question.type,
    prompt: question.statement,
    sequence: question.sequence,
    isActive: question.isActive,
    options: question.options,
    validation: question.validation,
  }));
}

export async function submitQuiz(
  token: string,
  payload: QuizSubmitPayload,
): Promise<QuizAnalysisResult> {
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

  return (await response.json()) as QuizAnalysisResult;
}
