import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { ScoreLessonRequest } from "../schemas/scoreLesson.schema";
import { scoreLesson } from "../services/scoreLesson.service";

export async function scoreLessonController(
  request: FastifyRequest<ScoreLessonRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para pontuar a lição.", 401);
  }

  const answers = request.body?.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new AppError("As respostas da lição são obrigatórias.", 400);
  }

  try {
    const userId = session?.user.id ?? await ensureDevelopmentUser();
    const result = await scoreLesson(userId, request.params.lessonId, answers);
    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Lição não encontrada.") {
      throw new AppError(error.message, 404);
    }

    if (error instanceof Error && error.message === "A lição não possui perguntas ativas.") {
      throw new AppError(error.message, 422);
    }

    throw error;
  }
}
