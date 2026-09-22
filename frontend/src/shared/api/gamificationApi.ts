import { API_URL } from "../config/api";

export interface GamificationSummary {
  totalXp: number;
  currentLevel: number;
  levelName?: string;
}

export interface ScoreLessonResult extends GamificationSummary {
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  leveledUp: boolean;
  alreadyRewarded: boolean;
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
    throw new Error("Não foi possível carregar seu progresso de XP.");
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
    throw new ScoreLessonError(
      "Não foi possível registrar sua pontuação.",
      response.status,
    );
  }

  return (await response.json()) as ScoreLessonResult;
}
