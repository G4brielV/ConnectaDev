// src/modules/events/utils/parseDate.ts
const MONTHS_PT: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

export interface ParsedDate {
  day: string;
  month: string;
  time: string;
  startsAt: Date;
}

export function parseDateAndTime(raw: string): ParsedDate | null {
  if (!raw) return null;

  // "25 OUT às 19:00" | "25 out 2026 · 19:00" | "Sáb, 25 Out - 19:00"
  const dateMatch = raw.match(/(\d{1,2})\s*[\/\s\-.]?\s*([a-z]{3,})/i);
  const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*h?/);
  if (!dateMatch) return null;

  const day = dateMatch[1].padStart(2, "0");
  const monthKey = dateMatch[2].toLowerCase().slice(0, 3);
  const monthIdx = MONTHS_PT[monthKey];
  if (monthIdx === undefined) return null;

  const hours = timeMatch ? Number(timeMatch[1]) : 19;
  const minutes = timeMatch?.[2] ? Number(timeMatch[2]) : 0;

  const monthLabel = dateMatch[2].slice(0, 3);
  const monthCapitalized =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).toLowerCase();

  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, monthIdx, Number(day), hours, minutes);

  // Se a data já passou faz muito tempo, é o ano seguinte
  if (candidate.getTime() < now.getTime() - 30 * 86_400_000) {
    year += 1;
    candidate = new Date(year, monthIdx, Number(day), hours, minutes);
  }

  return {
    day,
    month: monthCapitalized, // "Out"
    time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    startsAt: candidate,
  };
}