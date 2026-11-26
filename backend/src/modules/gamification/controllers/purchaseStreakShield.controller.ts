import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import {
  purchaseStreakShield,
  StreakShieldError,
} from "../services/streakShield.service";

export async function purchaseStreakShieldController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para resgatar um escudo.", 401);
  }

  try {
    const userId = session?.user.id ?? (await ensureDevelopmentUser());
    const result = await purchaseStreakShield(userId);
    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof StreakShieldError) {
      throw new AppError(error.message, error.statusCode);
    }
    throw error;
  }
}
