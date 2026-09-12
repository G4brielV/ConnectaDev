import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { QuizSubmitRequest } from "../schemas/quiz.schemas";
import {
  AiGatewayTimeoutError,
  AiGatewayRequestError,
  submitQuiz,
} from "../services/submitQuiz.service";
import { ensureDevelopmentUser, prisma } from "../../../lib/auth";

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

  const developmentMode = process.env.NODE_ENV !== "production";
  const session = developmentMode ? null : await auth.api.getSession({ headers });

  if (!session && !developmentMode) {
    throw new AppError("É necessário estar autenticado para enviar o quiz.", 401);
  }

  const payload = request.body;
  if (!payload || !payload.answers || typeof payload.answers !== "object") {
    throw new AppError("As respostas do quiz são obrigatórias.", 400);
  }

  try {
    const userId = session?.user.id ?? await ensureDevelopmentUser();
    const result = await submitQuiz(payload, userId);
    await prisma.vocationalDiagnosis.upsert({
        where: { userId },
        create: {
          userId,
          areaPrincipal: result.areaPrincipal,
          tecnologiasSugeridas: result.tecnologiasSugeridas,
        },
        update: {
          areaPrincipal: result.areaPrincipal,
          tecnologiasSugeridas: result.tecnologiasSugeridas,
        },
    });
    return reply.send(result);
  } catch (error) {
    if (error instanceof AiGatewayTimeoutError) {
      throw new AppError(error.message, 504);
    }

    if (error instanceof AiGatewayRequestError) {
      throw new AppError(
        `Não foi possível processar o perfil pela IA: ${error.message}`,
        502,
      );
    }

    throw new AppError(
      error instanceof Error
        ? error.message
        : "Não foi possível processar o perfil pela IA.",
      502,
    );
  }
}
