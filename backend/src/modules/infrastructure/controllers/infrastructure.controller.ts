import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser, prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import {
  getInfrastructureQuerySchema,
  createInfrastructureSchema,
} from "../schemas/infrastructure.schemas";
import { InfrastructureService } from "../services/infrastructure.service";

function requestHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }
  return headers;
}

export async function listInfrastructureController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await auth.api.getSession({ headers: requestHeaders(request) });
  if (!session && process.env.NODE_ENV === "production") {
    throw new AppError("É necessário estar autenticado para acessar os pontos de apoio.", 401);
  }

  // Permite desenvolvimento local caso não haja sessão ativa
  if (!session) {
    await ensureDevelopmentUser();
  }

  const query = getInfrastructureQuerySchema.parse(request.query);
  const service = new InfrastructureService(prisma);
  const points = await service.list(query);

  return reply.status(200).send(points);
}

export async function createInfrastructureController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = createInfrastructureSchema.parse(request.body);
  const service = new InfrastructureService(prisma);
  const point = await service.create(body);

  return reply.status(201).send(point);
}
