import { FastifyInstance } from "fastify";
import { getCourseRecommendationsController } from "../controllers/getCourseRecommendations.controller";

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/courses/recommendations",
    getCourseRecommendationsController,
  );
}
