import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getReviewQuestionsParamsSchema } from "../schemas/review.schema";
import { getReviewQuestionsService } from "../services/review.service";

export async function getReviewQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para acessar a revisão.", 401);
  }

  const userId = session?.user.id ?? (await ensureDevelopmentUser());

  const parsedParams = getReviewQuestionsParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    throw new AppError(parsedParams.error.issues[0]?.message ?? "Parâmetros inválidos.", 400);
  }

  const result = await getReviewQuestionsService(userId, parsedParams.data.topicId);
  return reply.status(200).send(result);
}
