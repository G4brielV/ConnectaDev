import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getQuizQuestions } from "../services/getQuizQuestions.service";

type QuizSessionResolver = (context: {
  headers: Headers;
}) => Promise<unknown>;

export async function getQuizQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
  loadQuestions: typeof getQuizQuestions = getQuizQuestions,
  getSession: QuizSessionResolver = ({ headers }) =>
    auth.api.getSession({ headers }),
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  const session = await getSession({ headers });

  if (!session) {
    throw new AppError("É necessário estar autenticado para acessar o quiz.", 401);
  }

  return reply.status(200).send(await loadQuestions());
}
