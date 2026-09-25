import { API_URL } from "../config/api";

export interface GamificationSummary {
  totalXp: number;
  currentLevel: number;
  levelName?: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedReviews: number;
}

export interface ScoreLessonResult {
  totalXp: number;
  currentLevel: number;
  levelName?: string;
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  leveledUp: boolean;
  alreadyRewarded: boolean;
  /** Percentual de acerto e nota de corte da fase */
  percentage: number;
  passingScore: number;
  /** Aprovado no gate: libera a fase seguinte */
  passed: boolean;
  stars: number;
  currentStreak: number;
  longestStreak: number;
  /** @deprecated use `passed` */
  completed: boolean;
}

export class ScoreLessonError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ScoreLessonError";
    this.status = status;
  }
}

export async function fetchGamificationSummary(
  token: string,
): Promise<GamificationSummary> {
  const response = await fetch(`${API_URL}/api/gamification/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar seu progresso.",
    );
  }

  return (await response.json()) as GamificationSummary;
}

export async function scoreLesson(
  token: string,
  lessonId: string,
  answers: Record<string, string>,
): Promise<ScoreLessonResult> {
  const response = await fetch(`${API_URL}/api/trails/lessons/${lessonId}/score`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    // O backend explica o motivo (ex.: 403 de fase ainda bloqueada);
    // repassar a mensagem dele evita um erro genérico na tela.
    let message = "Não foi possível registrar sua pontuação.";
    try {
      const body = (await response.clone().json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // sem corpo JSON: fica a mensagem padrão
    }
    throw new ScoreLessonError(
      message,
      response.status,
    );
  }

  return (await response.json()) as ScoreLessonResult;
}
