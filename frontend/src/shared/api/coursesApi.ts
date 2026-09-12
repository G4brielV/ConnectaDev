import { API_URL } from "../config/api";

export interface CourseRecommendation {
  id: string;
  thumbnail: string;
  title: string;
  provider: string;
  level: string;
  external_url: string;
  tags: string[];
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
      Authorization: `******`,
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
