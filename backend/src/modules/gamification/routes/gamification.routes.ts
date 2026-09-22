import { FastifyInstance } from "fastify";
import { getGamificationController } from "../controllers/getGamification.controller";
import { scoreLessonController } from "../controllers/scoreLesson.controller";
import {
  getTrailLessonController,
  getTrailsController,
} from "../controllers/getTrails.controller";


export async function gamificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/gamification/me", getGamificationController);
  fastify.post(
    "/api/trails/lessons/:lessonId/score",
    scoreLessonController,
  );
  fastify.get("/api/trails/recommendations", getTrailsController);
  fastify.get(
    "/api/trails/lessons/:lessonId",
    getTrailLessonController,
  );
}
