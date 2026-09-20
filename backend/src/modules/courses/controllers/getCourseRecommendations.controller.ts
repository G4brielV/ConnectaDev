import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getCourseRecommendations } from "../services/getCourseRecommendations.service";

export async function getCourseRecommendationsController(
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
    throw new AppError("É necessário estar autenticado para acessar os cursos.", 401);
  }

  const userId = session?.user.id ?? await ensureDevelopmentUser();
  return reply.status(200).send(
    await getCourseRecommendations(userId),
  );
}
