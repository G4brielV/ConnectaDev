import { PrismaClient } from "@prisma/client/extension";

// src/modules/events/types/event.ts
export type EventFormat = "Online" | "Presencial" | "Híbrido";
export type EventFilter = "Todos" | EventFormat;

export interface EventItem {
  id: string;
  day: string;       // "25"
  month: string;     // "Out"
  time: string;      // "19:00"
  title: string;
  category: string;  // "Tecnologia" ou mais específico ("IA", "Frontend", ...)
  location: string;  // "Recife, PE" | "Online"
  format: string;    // "Presencial" | "Online" | "Híbrido" (label de exibição)
  filter: Exclude<EventFilter, "Todos">; // chave usada nos filtros da UI
}

export interface ScrapedEvent {
  externalId: string;
  day: string;
  month: string;
  time: string;
  startsAt: Date;
  title: string;
  category: string;
  location: string;
  format: EventFormat;
  filter: Exclude<EventFilter, "Todos">;
  link: string;
}

export interface EventsRepository {
  event: Pick<PrismaClient["event"], "upsert" | "updateMany" | "findMany">;
  $transaction?: <T>(
    cb: (tx: EventsRepository) => Promise<T>,
  ) => Promise<T>;
}