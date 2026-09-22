import { FastifyInstance } from "fastify";
import { getReviewQuestionsController } from "../controllers/getReviewQuestions.controller";
import { submitReviewController } from "../controllers/submitReview.controller";

export async function reviewRoutes(fastify: FastifyInstance) {
  fastify.get("/api/reviews/:topicId/questions", getReviewQuestionsController);
  fastify.post("/api/reviews/:sessionId/submit", submitReviewController);
}
