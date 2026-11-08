// src/modules/events/services/getEvents.service.ts
import { prisma } from "../../../lib/auth";
import type { EventItem } from "../types/EventsTypes";
const EMPTY_MESSAGE = "Nenhum evento encontrado na RMR no momento. Volte em breve!";

export async function getEvents(
  filter?: EventItem["filter"],
): Promise<{ events: EventItem[]; message?: string; canRetry: boolean }> {
  const rows = await prisma.event.findMany({
    where: {
      isExpired: false,
      startsAt: { gte: new Date() },  // não mostra evento que já passou
      ...(filter ? { filter } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true, day: true, month: true, time: true,
      startsAt: true, title: true, category: true, location: true,
      format: true, filter: true, link: true,
    },
  });

  const events: EventItem[] = rows.map((r) => ({
    id: r.id,
    day: r.day,
    month: r.month,
    time: r.time,
    startsAt: r.startsAt,
    title: r.title,
    category: r.category,
    location: r.location,
    format: r.format,
    filter: r.filter as EventItem["filter"],
    link: r.link,
  }));

  return {
    events,
    ...(events.length === 0 ? { message: EMPTY_MESSAGE } : {}),
    canRetry: events.length === 0,
  };
}