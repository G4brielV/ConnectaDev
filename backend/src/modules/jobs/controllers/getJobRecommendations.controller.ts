import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getJobRecommendations } from "../services/getJobRecommendations.service";

function requestHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }
  return headers;
}

export async function getJobRecommendationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const session = await auth.api.getSession({ headers: requestHeaders(request) });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para acessar as vagas.", 401);
  }

  const userId = session?.user.id ?? await ensureDevelopmentUser();
  return reply.status(200).send(await getJobRecommendations(userId));
}
