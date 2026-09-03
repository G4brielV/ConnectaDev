import { FastifyInstance } from "fastify";
import { getQuizQuestionsController } from "../controllers/getQuizQuestions.controller";

export async function quizRoutes(fastify: FastifyInstance) {
  fastify.get("/api/quiz/questions", getQuizQuestionsController);
}
