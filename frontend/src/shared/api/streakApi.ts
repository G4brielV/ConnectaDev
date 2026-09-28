import { API_URL } from "../config/api";

export type WeekDayStatus = "done" | "pending" | "missed" | "upcoming";

export interface StreakWeekDay {
  /** YYYY-MM-DD, no dia de estudo de Recife */
  day: string;
  label: string;
  isToday: boolean;
  status: WeekDayStatus;
}

export interface StreakMilestone {
  days: number;
  title: string;
  achieved: boolean;
  isNew: boolean;
  progress: number;
}

export interface StreakOverview {
  currentStreak: number;
  longestStreak: number;
  today: string;
  activeToday: boolean;
  /** Ofensiva viva, mas ainda sem estudo hoje */
  atRisk: boolean;
  tier: string;
  week: StreakWeekDay[];
  month: {
    /** YYYY-MM */
    month: string;
    isCurrent: boolean;
    activeDays: string[];
  };
  milestones: StreakMilestone[];
}

export class StreakError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StreakError";
    this.status = status;
  }
}

export async function fetchStreakOverview(token: string, month?: string): Promise<StreakOverview> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const query = month ? `?month=${encodeURIComponent(month)}` : "";

  const response = await fetch(`${API_URL}/api/gamification/streak${query}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    let message =
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar sua ofensiva agora.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // resposta sem corpo JSON: fica a mensagem padrão
    }
    throw new StreakError(message, response.status);
  }

  return (await response.json()) as StreakOverview;
}
