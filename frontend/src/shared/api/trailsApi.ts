import { API_URL } from "../config/api";

export interface TrailOption {
  id: string;
  label: string;
}

export interface TrailQuestion {
  id: string;
  statement: string;
  type: string;
  sequence: number;
  options: TrailOption[] | null;
  validation: { minLength?: number; maxLength?: number } | null;
}

export interface TrailLesson {
  id: string;
  title: string;
  sequence: number;
  xpReward: number;
  questions: TrailQuestion[];
}

export interface TrailRecommendation {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  lessons: TrailLesson[];
}

export async function fetchTrailRecommendations(
  token: string,
): Promise<TrailRecommendation[]> {
  const response = await fetch(`${API_URL}/api/trails/recommendations`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar suas trilhas.");
  }

  return (await response.json()) as TrailRecommendation[];
}

export async function fetchTrailLesson(
  token: string,
  lessonId: string,
): Promise<TrailLesson> {
  const response = await fetch(`${API_URL}/api/trails/lessons/${lessonId}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a lição.");
  }

  return (await response.json()) as TrailLesson;
}
