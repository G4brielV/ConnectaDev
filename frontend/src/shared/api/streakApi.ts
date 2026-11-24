import { API_URL } from "../config/api";

export type WeekDayStatus = "done" | "shielded" | "pending" | "missed" | "upcoming";

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
  /** Bônus pago na primeira vez que a ofensiva chega ao marco. */
  xp: number;
  achieved: boolean;
  isNew: boolean;
  progress: number;
}

export interface StreakShieldStatus {
  count: number;
  max: number;
  cost: number;
  availableXp: number;
}

export interface StreakOverview {
  currentStreak: number;
  longestStreak: number;
  today: string;
  activeToday: boolean;
  /** Ofensiva viva, mas ainda sem estudo hoje */
  atRisk: boolean;
  tier: string;
  shield: StreakShieldStatus;
  week: StreakWeekDay[];
  month: {
    /** YYYY-MM */
    month: string;
    isCurrent: boolean;
    activeDays: string[];
    shieldedDays: string[];
  };
  milestones: StreakMilestone[];
}

export interface PurchaseStreakShieldResponse {
  streakShields: number;
  maxShields: number;
  shieldCost: number;
  totalXp: number;
  availableXp: number;
  currentLevel: number;
}

export class StreakError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StreakError";
    this.status = status;
  }
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 401) {
    return "Sua sessão não é válida. Faça login para continuar.";
  }
  try {
    const body = (await response.json()) as { message?: string };
    if (body?.message) return body.message;
  } catch {
    // resposta sem corpo JSON: fica a mensagem padrão
  }
  return fallback;
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
    const message = await parseErrorMessage(
      response,
      "Não foi possível carregar sua ofensiva agora.",
    );
    throw new StreakError(message, response.status);
  }

  return (await response.json()) as StreakOverview;
}

export async function purchaseStreakShield(token: string): Promise<PurchaseStreakShieldResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const response = await fetch(`${API_URL}/api/gamification/streak/shield`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      "Não foi possível resgatar o escudo agora.",
    );
    throw new StreakError(message, response.status);
  }

  return (await response.json()) as PurchaseStreakShieldResponse;
}
