import { API_URL } from "../config/api";

export interface GamificationSummary {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedReviews: number;
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
