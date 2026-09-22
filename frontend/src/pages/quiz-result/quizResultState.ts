import type { QuizAnalysisResult } from "../../shared/api/quizApi";
import type { CourseRecommendation } from "../../shared/api/coursesApi";

export interface QuizResultSummary {
  areaPrincipal: string;
  areasSecundarias: string[];
  justificativa: string;
  tecnologias: string[];
}

// Normaliza o retorno da IA para exibição: remove vazios/duplicados e a área principal das secundárias
export function buildQuizResultSummary(result: QuizAnalysisResult): QuizResultSummary {
  const areaPrincipal = result.areaPrincipal.trim();
  const unique = (values: string[]) =>
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

  return {
    areaPrincipal,
    areasSecundarias: unique(result.areasSecundarias).filter((area) => area !== areaPrincipal),
    justificativa: result.justificativa.trim(),
    tecnologias: unique(result.tecnologiasSugeridas),
  };
}

export type FirstCourseState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; course: CourseRecommendation };

export function pickFirstCourse(courses: CourseRecommendation[]): FirstCourseState {
  const [course] = courses;
  return course ? { status: "ready", course } : { status: "empty" };
}
