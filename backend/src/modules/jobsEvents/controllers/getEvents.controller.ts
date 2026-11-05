// src/modules/events/controllers/getEvents.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { getEvents } from "../services/getEvents.service";
import { EventFilter } from "../types/EventsTypes";

export async function getEventsController(
  request: FastifyRequest<{ Querystring: { filter?: EventFilter } }>,
  reply: FastifyReply,
) {
  const q = request.query.filter;
  const filter = q && q !== "Todos" ? q : undefined;
  return reply.status(200).send(await getEvents(filter));
}