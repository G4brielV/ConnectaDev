import { API_URL } from "../config/api";

export interface ReviewOption {
  id: string;
  label: string;
}

export interface ReviewQuestion {
  id: string;
  statement: string;
  sequence: number;
  options: ReviewOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ReviewSessionResponse {
  sessionId: string;
  topicId: string;
  topicTitle: string;
  /** True when the user already completed this topic before (retakes earn no XP). */
  alreadyCompleted: boolean;
  questions: ReviewQuestion[];
}

export interface ReviewAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface QuestionResultItem {
  questionId: string;
  statement: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ReviewSubmitResponse {
  sessionId: string;
  topicId: string;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  /** False when the topic had already been completed by this user (training mode, 0 XP). */
  isFirstCompletion: boolean;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
  results: QuestionResultItem[];
}

export async function fetchReviewQuestions(
  token: string,
  topicId: string,
): Promise<ReviewSessionResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/api/reviews/${topicId}/questions`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login para continuar.");
      }
      if (response.status === 404) {
        throw new Error("Tópico de revisão não encontrado.");
      }
      throw new Error("Não foi possível carregar as perguntas de revisão.");
    }

    return (await response.json()) as ReviewSessionResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitReview(
  token: string,
  sessionId: string,
  answers: ReviewAnswerInput[],
): Promise<ReviewSubmitResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/api/reviews/${sessionId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login para continuar.");
      }
      if (response.status === 409) {
        throw new Error("Esta revisão já foi finalizada. Inicie uma nova revisão para continuar.");
      }
      throw new Error("Não foi possível salvar seu resultado. Verifique sua conexão");
    }

    return (await response.json()) as ReviewSubmitResponse;
  } finally {
    clearTimeout(timeout);
  }
}
