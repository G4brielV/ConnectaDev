import { prisma } from "../../../lib/auth";
import type {
  TrailLessonResponse,
  TrailRecommendationResponse,
} from "../schemas/trail.schemas";

export async function getTrailsForUser(
  userId: string,
): Promise<TrailRecommendationResponse[]> {
  const diagnosis = await prisma.vocationalDiagnosis.findUnique({
    where: { userId },
    select: { areaPrincipal: true },
  });

  if (!diagnosis) return [];

  const trails = await prisma.trail.findMany({
    where: { isActive: true, area: diagnosis.areaPrincipal },
    orderBy: { createdAt: "asc" },
    take: 3,
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { sequence: "asc" },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { sequence: "asc" },
            select: {
              id: true,
              statement: true,
              type: true,
              sequence: true,
              options: true,
              validation: true,
            },
          },
        },
      },
    },
  });

  return trails.map((trail): TrailRecommendationResponse => ({
    id: trail.id,
    title: trail.title,
    description: trail.description,
    area: trail.area,
    lessons: trail.lessons.map(
      (lesson): TrailLessonResponse => ({
        id: lesson.id,
        title: lesson.title,
        sequence: lesson.sequence,
        xpReward: lesson.xpReward,
        questions: lesson.questions,
      }),
    ),
  }));
}

export async function getTrailLesson(
  lessonId: string,
): Promise<TrailLessonResponse | null> {
  const lesson = await prisma.trailLesson.findFirst({
    where: { id: lessonId, isActive: true, trail: { isActive: true } },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          statement: true,
          type: true,
          sequence: true,
          options: true,
          validation: true,
        },
      },
    },
  });

  if (!lesson) return null;

  return {
    id: lesson.id,
    title: lesson.title,
    sequence: lesson.sequence,
    xpReward: lesson.xpReward,
    questions: lesson.questions,
  };
}
