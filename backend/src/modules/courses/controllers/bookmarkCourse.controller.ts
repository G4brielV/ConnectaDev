import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { bookmarkCourse } from "../services/bookmarkCourse.service";

interface BookmarkCourseRequest {
  Params: {
    courseId: string;
  };
}

export async function bookmarkCourseController(
  request: FastifyRequest<BookmarkCourseRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para salvar cursos.", 401);
  }

  const userId = session?.user.id ?? await ensureDevelopmentUser();
  try {
    await bookmarkCourse(userId, request.params.courseId);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Curso não encontrado.") {
      throw new AppError(error.message, 404);
    }
    throw error;
  }

  return reply.status(201).send({ saved: true });
}
