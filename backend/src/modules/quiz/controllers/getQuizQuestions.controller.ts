import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getQuizQuestions } from "../services/getQuizQuestions.service";

export async function getQuizQuestionsController(
  request: FastifyRequest,
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

  const developmentMode = process.env.NODE_ENV === "development";
  const session = developmentMode ? null : await auth.api.getSession({ headers });

  if (!session && !developmentMode) {
    throw new AppError("É necessário estar autenticado para acessar o quiz.", 401);
  }

  return reply.send(getQuizQuestions());
}
