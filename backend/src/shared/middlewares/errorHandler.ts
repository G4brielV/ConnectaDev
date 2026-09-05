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
    let message = fastifyError.message;
    // Sanitização para evitar vazamento de erros de parser ou traces na resposta
    if (fastifyError.statusCode === 400 && /json|syntax|token|body/i.test(fastifyError.message)) {
      message = "Formato de requisição inválido. Verifique os dados enviados.";
    }

    return reply.status(fastifyError.statusCode).send({
      statusCode: fastifyError.statusCode,
      error: fastifyError.name || "Error",
      message,
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
