import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../../shared/errors/AppError";
import {
  practiceAnswerBodySchema,
  practiceSessionParamsSchema,
} from "../schemas/dailyPractice.schemas";
import {
  answerPracticeQuestion,
  completeDailyPractice,
  startDailyPractice,
} from "../services/dailyPractice.service";
import { getUserId } from "./getTrails.controller";

function parseSessionId(params: unknown): string {
  const parsed = practiceSessionParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Prática inválida.", 400);
  }
  return parsed.data.sessionId;
}

/** Abre a prática do dia: perguntas da fase atual + revisão, sem gabarito. */
export async function startDailyPracticeController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  return reply.status(201).send(await startDailyPractice(userId));
}

/** Responde uma pergunta e devolve a correção dela. */
export async function answerPracticeQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  const sessionId = parseSessionId(request.params);
  const body = practiceAnswerBodySchema.safeParse(request.body);
  if (!body.success) {
    throw new AppError(body.error.issues[0]?.message ?? "Resposta inválida.", 400);
  }

  const result = await answerPracticeQuestion(
    userId,
    sessionId,
    body.data.questionId,
    body.data.selectedOptionId,
  );
  return reply.status(200).send(result);
}

/** Fecha a prática: XP (se for a primeira do dia) e ofensiva. */
export async function completeDailyPracticeController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  const sessionId = parseSessionId(request.params);
  return reply.status(200).send(await completeDailyPractice(userId, sessionId));
}
