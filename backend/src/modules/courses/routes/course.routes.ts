import { FastifyInstance } from "fastify";
import { getCourseRecommendationsController } from "../controllers/getCourseRecommendations.controller";
import { bookmarkCourseController } from "../controllers/bookmarkCourse.controller";

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/courses/recommendations",
    getCourseRecommendationsController,
  );
  fastify.post(
    "/api/courses/:courseId/bookmark",
    bookmarkCourseController,
  );
}
