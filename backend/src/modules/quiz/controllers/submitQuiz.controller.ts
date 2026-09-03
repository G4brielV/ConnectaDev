import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { QuizSubmitRequest } from "../schemas/quiz.schemas";
import { submitQuiz } from "../services/submitQuiz.service";

export async function submitQuizController(
  request: FastifyRequest<{ Body: QuizSubmitRequest }>,
  reply: FastifyReply,
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  const developmentBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_QUIZ_WITHOUT_AUTH === "true";
  const session = developmentBypass
    ? null
    : await auth.api.getSession({ headers });

  if (!session && !developmentBypass) {
    throw new AppError("É necessário estar autenticado para enviar o quiz.", 401);
  }

  const payload = request.body;
  if (!payload || !payload.answers || typeof payload.answers !== "object") {
    throw new AppError("As respostas do quiz são obrigatórias.", 400);
  }

  return reply.send(submitQuiz(payload));
}
