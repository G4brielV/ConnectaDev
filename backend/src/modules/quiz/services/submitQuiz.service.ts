import { QuizSubmitRequest } from "../schemas/quiz.schemas";

export interface QuizSubmitResponse {
  status: "received";
  answerCount: number;
}

export function submitQuiz(
  payload: QuizSubmitRequest,
): QuizSubmitResponse {
  return {
    status: "received",
    answerCount: Object.keys(payload.answers).length,
  };
}
