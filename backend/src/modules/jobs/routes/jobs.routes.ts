import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { getJobRecommendationsController } from "../controllers/getJobRecommendations.controller";
import { synchronizeJobsManually } from "../services/joobleIntegration.service";

function hasValidAdminToken(request: FastifyRequest): boolean {
  const configuredToken = process.env.ADMIN_SYNC_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const authorization = request.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;
  const providedToken = request.headers["x-admin-token"] ?? bearerToken;
  if (typeof providedToken !== "string") {
    return false;
  }

  const expected = Buffer.from(configuredToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function jobsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/jobs/recommendations", getJobRecommendationsController);

  fastify.post("/api/jobs/sync", async (request, reply) => {
    if (!process.env.ADMIN_SYNC_TOKEN) {
      return reply.code(503).send({
        error: "Sincronização administrativa não configurada.",
      });
    }

    if (!hasValidAdminToken(request)) {
      return reply.code(401).send({ error: "Credenciais administrativas inválidas." });
    }

    try {
      const summary = await synchronizeJobsManually();
      return reply.code(200).send(summary);
    } catch (error) {
      request.log.error({ error }, "ADMIN_JOB_SYNC_ERROR");
      return reply.code(500).send({
        error: "Não foi possível sincronizar as vagas.",
      });
    }
  });
}
