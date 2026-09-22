import { API_URL } from "../config/api";

export interface CourseRecommendation {
  id: string;
  thumbnail: string;
  title: string;
  provider: string;
  level: string;
  external_url: string;
  tags: string[];
  userRating: {
    rating: number;
    comment: string | null;
    matchedProfile: boolean | null;
  } | null;
}

export interface CourseRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  courses: CourseRecommendation[];
}

export async function fetchCourseRecommendations(
  token: string,
): Promise<CourseRecommendationsResponse> {
  const response = await fetch(`${API_URL}/api/courses/recommendations`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar os cursos recomendados.",
    );
  }

  return (await response.json()) as CourseRecommendationsResponse;
}

export async function bookmarkCourse(
  token: string,
  courseId: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/courses/${courseId}/bookmark`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível salvar o curso nos seus favoritos.");
  }
}

export async function rateCourse(
  token: string,
  courseId: string,
  payload: { rating: number; comment?: string; matchedProfile: boolean },
): Promise<{ rating: number; comment: string | null; matchedProfile: boolean | null }> {
  return sendCourseRating(token, courseId, payload, "POST");
}

export async function updateCourseRating(
  token: string,
  courseId: string,
  payload: { rating: number; comment?: string; matchedProfile: boolean },
): Promise<{ rating: number; comment: string | null; matchedProfile: boolean | null }> {
  return sendCourseRating(token, courseId, payload, "PUT");
}

async function sendCourseRating(
  token: string,
  courseId: string,
  payload: { rating: number; comment?: string; matchedProfile: boolean },
  method: "POST" | "PUT",
): Promise<{ rating: number; comment: string | null; matchedProfile: boolean | null }> {
  const response = await fetch(`${API_URL}/api/courses/${courseId}/ratings`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível salvar sua avaliação.");
  }

  return (await response.json()) as { rating: number; comment: string | null; matchedProfile: boolean | null };
}
