import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getTrailLesson, getTrailsForUser } from "../services/getTrails.service";
import { getTrailMapForUser } from "../services/getTrailMap.service";
import { getTrailPhase } from "../services/getTrailPhase.service";
import type { TrailLessonRequest } from "../schemas/trail.schemas";

export async function getUserId(request: FastifyRequest): Promise<string> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await auth.api.getSession({ headers });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para acessar as trilhas.", 401);
  }

  return session?.user.id ?? ensureDevelopmentUser();
}

export async function getTrailsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  return reply.status(200).send(await getTrailsForUser(userId));
}

export async function getTrailLessonController(
  request: FastifyRequest<TrailLessonRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  await getUserId(request);
  const lesson = await getTrailLesson(request.params.lessonId);
  if (!lesson) throw new AppError("Lição não encontrada.", 404);
  return reply.status(200).send(lesson);
}

/** Mapa de fases da área do usuário, com progresso e bloqueio já resolvidos. */
export async function getTrailMapController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  return reply.status(200).send(await getTrailMapForUser(userId));
}

/** Uma fase para jogar: conteúdo de estudo + prova, respeitando o gate. */
export async function getTrailPhaseController(
  request: FastifyRequest<TrailLessonRequest>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = await getUserId(request);
  return reply.status(200).send(await getTrailPhase(userId, request.params.lessonId));
}
