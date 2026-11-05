import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getStreakOverview, InvalidStreakMonthError } from "../services/getStreak.service";

export interface StreakRequest {
  Querystring: { month?: string };
}

export async function getStreakController(
  request: FastifyRequest<StreakRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para ver sua ofensiva.", 401);
  }

  const month = request.query?.month;
  if (month !== undefined && typeof month !== "string") {
    throw new AppError("Mês inválido para o calendário da ofensiva.", 400);
  }

  try {
    const userId = session?.user.id ?? (await ensureDevelopmentUser());
    return reply.status(200).send(await getStreakOverview(userId, month));
  } catch (error) {
    if (error instanceof InvalidStreakMonthError) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }
}
