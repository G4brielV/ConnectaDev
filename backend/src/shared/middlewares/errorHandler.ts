import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: "App Error",
      message: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  // Se for um erro nativo do Fastify (ex: JSON mal formado, rota não encontrada)
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
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
