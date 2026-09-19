import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { submitReviewBodySchema, submitReviewParamsSchema } from "../schemas/review.schema";
import { submitReviewService } from "../services/review.service";

export async function submitReviewController(
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
    throw new AppError("É necessário estar autenticado para enviar a revisão.", 401);
  }

  const userId = session?.user.id ?? (await ensureDevelopmentUser());

  const parsedParams = submitReviewParamsSchema.safeParse(request.params);
  if (!parsedParams.success) {
    throw new AppError(parsedParams.error.issues[0]?.message ?? "ID de sessão inválido.", 400);
  }

  const parsedBody = submitReviewBodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    throw new AppError(parsedBody.error.issues[0]?.message ?? "Respostas inválidas.", 400);
  }

  const result = await submitReviewService(
    userId,
    parsedParams.data.sessionId,
    parsedBody.data.answers,
  );

  return reply.status(200).send(result);
}
