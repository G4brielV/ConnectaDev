import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { CourseRatingRequest } from "../schemas/course.schemas";
import { rateCourse } from "../services/rateCourse.service";

export async function rateCourseController(
  request: FastifyRequest<CourseRatingRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para avaliar cursos.", 401);
  }

  const { rating, comment, matchedProfile } = request.body || {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("A nota deve ser um número inteiro entre 1 e 5.", 400);
  }

  if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) {
    throw new AppError("O comentário deve ter no máximo 1000 caracteres.", 400);
  }

  if (matchedProfile !== undefined && typeof matchedProfile !== "boolean") {
    throw new AppError("A aderência ao perfil deve ser um valor booleano.", 400);
  }

  try {
    const userId = session?.user.id ?? await ensureDevelopmentUser();
    const savedRating = await rateCourse(
      userId,
      request.params.courseId,
      rating,
      comment?.trim(),
      matchedProfile,
    );
    return reply.status(request.method === "PUT" ? 200 : 201).send(savedRating);
  } catch (error) {
    if (error instanceof Error && error.message === "Curso não encontrado.") {
      throw new AppError(error.message, 404);
    }
    throw error;
  }
}