import { FastifyInstance } from "fastify";
import { getQuizQuestionsController } from "../controllers/getQuizQuestions.controller";
import { submitQuizController } from "../controllers/submitQuiz.controller";

export async function quizRoutes(fastify: FastifyInstance) {
  fastify.get("/api/quiz/questions", getQuizQuestionsController);
  fastify.post("/quiz/submit", submitQuizController);
}
