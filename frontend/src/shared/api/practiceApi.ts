import { API_URL } from "../config/api";

export interface PracticeQuestion {
  id: string;
  statement: string;
  options: Array<{ id: string; label: string }>;
  phaseTitle: string;
  /** Veio de uma fase já concluída, não da fase atual. */
  isReview: boolean;
}

export interface DailyPractice {
  sessionId: string;
  /** Ainda não houve prática com XP hoje: esta vale até `maxXp`. */
  rewardAvailable: boolean;
  xpPerCorrect: number;
  maxXp: number;
  currentPhase: { id: string; title: string } | null;
  /** Sem gabarito: a correção chega pergunta a pergunta. */
  questions: PracticeQuestion[];
}

export interface PracticeAnswerResult {
  questionId: string;
  /** A primeira resposta dada, que é a que vale. */
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface DailyPracticeResult {
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  /** Esta foi a prática do dia que valeu XP; false = treino livre. */
  rewarded: boolean;
  totalXp: number;
  currentLevel: number;
  levelName: string;
  leveledUp: boolean;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
}

export class PracticeError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PracticeError";
    this.status = status;
  }
}

async function post<T>(path: string, token: string, body?: unknown, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    let message =
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível continuar a prática agora.";
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // resposta sem corpo JSON: fica a mensagem padrão
    }
    throw new PracticeError(message, response.status);
  }

  return (await response.json()) as T;
}

/**
 * Timeout generoso: se o banco da fase atual ainda estiver vazio, o servidor
 * gera as perguntas por IA antes de responder.
 */
export async function startDailyPractice(token: string): Promise<DailyPractice> {
  return post<DailyPractice>("/api/trails/practice", token, undefined, 95000);
}

export async function answerPracticeQuestion(
  token: string,
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
): Promise<PracticeAnswerResult> {
  return post<PracticeAnswerResult>(`/api/trails/practice/${sessionId}/answers`, token, {
    questionId,
    selectedOptionId,
  });
}

export async function completeDailyPractice(
  token: string,
  sessionId: string,
): Promise<DailyPracticeResult> {
  return post<DailyPracticeResult>(`/api/trails/practice/${sessionId}/complete`, token);
}
