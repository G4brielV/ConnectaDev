import { FastifyInstance } from "fastify";
import {
  listInfrastructureController,
  createInfrastructureController,
} from "../controllers/infrastructure.controller";

export async function infrastructureRoutes(fastify: FastifyInstance) {
  fastify.get("/api/infrastructure", listInfrastructureController);
  fastify.post("/api/infrastructure", createInfrastructureController);
}
