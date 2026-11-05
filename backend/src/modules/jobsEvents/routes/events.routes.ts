// src/modules/events/events.routes.ts
import type { FastifyInstance } from "fastify";
import { getEventsController } from "../controllers/getEvents.controller";
import { SymplaIntegrationService } from "../services/symplaIntegration.service";
import { hasValidAdminToken } from "../../jobs/routes/jobs.routes";

export async function eventsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/events", getEventsController);

  fastify.post("/api/events/sync", async (request, reply) => {
    if (!hasValidAdminToken(request)) {
      return reply.code(401).send({ error: "Credenciais inválidas." });
    }
    try {
      const result = await new SymplaIntegrationService().synchronize();
      return reply.code(200).send(result);
    } catch (error) {
      request.log.error({ error }, "ADMIN_EVENT_SYNC_ERROR");
      return reply.code(500).send({ error: "Falha ao sincronizar eventos." });
    }
  });
}