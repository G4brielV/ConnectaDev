import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: "App Error",
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    });
  }

  const fastifyError = error as FastifyError;

  // Se for um erro nativo do Fastify (ex: JSON mal formado, rota não encontrada)
  if (typeof fastifyError.statusCode === "number") {
    return reply.status(fastifyError.statusCode).send({
      statusCode: fastifyError.statusCode,
      error: fastifyError.name || "Error",
      message: fastifyError.message,
    });
  }

  // Erros não esperados e não tratados
  request.log.error(error); // Loga o stack no console
  
  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Ocorreu um erro interno no servidor.",
  });
}
