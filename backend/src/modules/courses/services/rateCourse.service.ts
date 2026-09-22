import { prisma } from "../../../lib/auth";

export async function rateCourse(
  userId: string,
  courseId: string,
  rating: number,
  comment?: string,
  matchedProfile?: boolean,
): Promise<{ rating: number; comment: string | null; matchedProfile: boolean | null }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Curso não encontrado.");
  }

  const savedRating = await prisma.courseRating.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, rating, comment: comment || null, matchedProfile },
    update: { rating, comment: comment || null, matchedProfile },
    select: { rating: true, comment: true, matchedProfile: true },
  });

  return savedRating;
}