import { prisma } from "../../../lib/auth";
import {
  CourseRecommendation,
  CourseRecommendationsResponse,
} from "../schemas/course.schemas";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function getCourseRecommendations(
  userId: string,
): Promise<CourseRecommendationsResponse> {
  const diagnosis = await prisma.vocationalDiagnosis.findUnique({
    where: { userId },
    select: { areaPrincipal: true, tecnologiasSugeridas: true },
  });

  if (!diagnosis) {
    return { hasDiagnosis: false, areaPrincipal: "", courses: [] };
  }

  const technologies = asStringArray(diagnosis.tecnologiasSugeridas).map((tag) =>
    tag.toLowerCase(),
  );
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      id: true,
      thumbnail: true,
      title: true,
      provider: true,
      level: true,
      externalUrl: true,
      tags: true,
      areas: true,
    },
  });

  const recommendations = courses
    .map((course) => {
      const tags = asStringArray(course.tags);
      const areas = asStringArray(course.areas);
      const areaMatch = areas.some(
        (area) => area.toLowerCase() === diagnosis.areaPrincipal.toLowerCase(),
      );
      const technologyMatches = tags.filter((tag) =>
        technologies.includes(tag.toLowerCase()),
      ).length;
      return {
        course: {
          id: course.id,
          thumbnail: course.thumbnail,
          title: course.title,
          provider: course.provider,
          level: course.level,
          external_url: course.externalUrl,
          tags,
        },
        score: (areaMatch ? 100 : 0) + technologyMatches,
        areaMatch,
      };
    })
    .filter(({ areaMatch }) => areaMatch)
    .sort((left, right) => right.score - left.score)
    .map(({ course }) => course as CourseRecommendation);

  return {
    hasDiagnosis: true,
    areaPrincipal: diagnosis.areaPrincipal,
    courses: recommendations,
  };
}
