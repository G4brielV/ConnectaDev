import { FastifyInstance } from "fastify";
import { getJobRecommendationsController } from "../controllers/getJobRecommendations.controller";

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/jobs/recommendations", getJobRecommendationsController);
}
