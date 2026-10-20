import { EventFilter, EventFormat } from "../types/EventsTypes";

export function detectFormat(rawText: string): EventFormat {
  const t = normalize(rawText);
  if (t.includes("online")) return "Online";
  if (t.includes("hibrid")) return "Híbrido";
  return "Presencial"; // default em listagem local
}

export function toFilter(format: EventFormat): Exclude<EventFilter, "Todos"> {
  return format; // hoje é 1:1
}

export function normalize(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}