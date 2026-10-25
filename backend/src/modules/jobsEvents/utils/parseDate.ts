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
  const dateMatch = raw.match(
    /\b(\d{1,2})\s*(?:de\s*)?([a-zç]{3,})(?:\s*(?:de\s*)?(\d{4}))?/i,
  );
  if (!dateMatch) return null;

  const day = dateMatch[1].padStart(2, "0");
  const monthKey = dateMatch[2].toLowerCase().slice(0, 3);
  const monthIdx = MONTHS_PT[monthKey];
  if (monthIdx === undefined) return null;

  const dateEnd = (dateMatch.index ?? 0) + dateMatch[0].length;
  const timeMatch = raw
    .slice(dateEnd)
    .match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(?:h|hrs?)?\b/i);
  const hours = timeMatch ? Number(timeMatch[1]) : 19;
  const minutes = timeMatch?.[2] ? Number(timeMatch[2]) : 0;

  const monthLabel = dateMatch[2].slice(0, 3);
  const monthCapitalized =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).toLowerCase();

  const now = new Date();
  let year = dateMatch[3] ? Number(dateMatch[3]) : now.getFullYear();
  let candidate = new Date(year, monthIdx, Number(day), hours, minutes);

  // Sem ano explícito, uma data muito antiga normalmente pertence ao próximo ano.
  if (!dateMatch[3] && candidate.getTime() < now.getTime() - 30 * 86_400_000) {
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