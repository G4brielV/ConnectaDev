import { FastifyInstance } from "fastify";
import { getGamificationController } from "../controllers/getGamification.controller";
import { scoreLessonController } from "../controllers/scoreLesson.controller";
import { getStreakController } from "../controllers/getStreak.controller";
import {
  answerPracticeQuestionController,
  completeDailyPracticeController,
  startDailyPracticeController,
} from "../controllers/dailyPractice.controller";
import {
  getTrailLessonController,
  getTrailMapController,
  getTrailPhaseController,
  getTrailsController,
} from "../controllers/getTrails.controller";

export async function gamificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/gamification/me", getGamificationController);
  fastify.get("/api/gamification/streak", getStreakController);
  fastify.post(
    "/api/trails/lessons/:lessonId/score",
    scoreLessonController,
  );
  fastify.get("/api/trails/map", getTrailMapController);
  fastify.get("/api/trails/phases/:lessonId", getTrailPhaseController);
  fastify.post("/api/trails/practice", startDailyPracticeController);
  fastify.post("/api/trails/practice/:sessionId/answers", answerPracticeQuestionController);
  fastify.post("/api/trails/practice/:sessionId/complete", completeDailyPracticeController);
  // Rotas antigas, mantidas enquanto o cliente novo não substitui de vez
  fastify.get("/api/trails/recommendations", getTrailsController);
  fastify.get(
    "/api/trails/lessons/:lessonId",
    getTrailLessonController,
  );
}
