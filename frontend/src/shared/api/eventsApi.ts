import { apiClient } from "./apiClient";

export type EventFormat = "Online" | "Presencial" | "Híbrido";

export interface EventItem {
  id: string;
  day: string;
  month: string;
  time: string;
  startsAt: string;
  title: string;
  category: string;
  location: string;
  format: EventFormat;
  link: string;
}

interface EventsResponse {
  events: EventItem[];
  message?: string;
  canRetry: boolean;
}

export async function fetchEvents(): Promise<EventsResponse> {
  const response = await apiClient.get<EventsResponse>("/api/events");
  return response.data;
}
