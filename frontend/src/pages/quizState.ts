import { QuizQuestion } from "../shared/api/quizApi";

export type QuizCatalogState = "ready" | "empty";

export function getQuizCatalogState(
  questions: QuizQuestion[],
): QuizCatalogState {
  return questions.length === 0 ? "empty" : "ready";
}
