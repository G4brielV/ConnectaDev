import { prisma } from "../../../lib/auth";

export interface BookmarkCourseRepository {
  findCourse: (args: { where: { id: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  upsertBookmark: (args: {
    where: { userId_courseId: { userId: string; courseId: string } };
    create: { userId: string; courseId: string };
    update: Record<string, never>;
  }) => Promise<unknown>;
}

export async function bookmarkCourse(
  userId: string,
  courseId: string,
  repository: BookmarkCourseRepository = {
    findCourse: (args) => prisma.course.findUnique(args),
    upsertBookmark: (args) => prisma.userCourseBookmark.upsert(args),
  },
): Promise<void> {
  const course = await repository.findCourse({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  await repository.upsertBookmark({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  });
}
