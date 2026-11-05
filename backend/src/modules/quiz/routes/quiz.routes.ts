import { FastifyInstance } from "fastify";
import { getQuizQuestionsController } from "../controllers/getQuizQuestions.controller";
import { submitQuizController } from "../controllers/submitQuiz.controller";
import { getQuizDiagnosisController } from "../controllers/getQuizDiagnosis.controller";

export async function quizRoutes(fastify: FastifyInstance) {
  fastify.get("/quiz/questions", getQuizQuestionsController);
  fastify.get("/api/quiz/questions", getQuizQuestionsController);
  fastify.post("/quiz/submit", submitQuizController);
  fastify.get("/quiz/diagnosis", getQuizDiagnosisController);
  fastify.get("/api/quiz/diagnosis", getQuizDiagnosisController);
}
