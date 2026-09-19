import { FastifyInstance } from "fastify";
import { getGamificationSummaryController } from "../controllers/getGamificationSummary.controller";

export async function gamificationRoutes(fastify: FastifyInstance) {
  fastify.get("/api/gamification/me", getGamificationSummaryController);
}
