import { API_URL } from "../config/api";

/** "available" é o baú bônus liberado: opcional, não trava a trilha. */
export type PhaseStatus = "completed" | "current" | "available" | "locked";
export type PhaseKind = "STANDARD" | "BONUS" | "BOSS";

export interface TrailMapPhase {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  kind: PhaseKind | string;
  xpReward: number;
  passingScore: number;
  status: PhaseStatus;
  unlocked: boolean;
  stars: number;
  bestPercentage: number;
  attempts: number;
  resourceCount: number;
}

export interface TrailMapUnit {
  id: string;
  title: string;
  sequence: number;
  phases: TrailMapPhase[];
  completedPhases: number;
  totalPhases: number;
  progressPercentage: number;
}

export interface DailyPracticeStatus {
  /** Há fase atual ou concluída para tirar perguntas. */
  available: boolean;
  /** A prática com XP de hoje ainda não foi feita. */
  rewardAvailable: boolean;
  maxXp: number;
}

export interface TrailMap {
  hasDiagnosis: boolean;
  area: string | null;
  trail: { id: string; title: string; description: string | null } | null;
  units: TrailMapUnit[];
  currentPhaseId: string | null;
  completedPhases: number;
  totalPhases: number;
  finished: boolean;
  dailyPractice: DailyPracticeStatus;
}

export interface PhaseResource {
  id: string;
  title: string;
  url: string;
  kind: string;
  thumbnail: string | null;
  provider: string | null;
}

/** Curso do catálogo sugerido pelo perfil do quiz, com o motivo da sugestão. */
export interface PhaseExtraResource extends PhaseResource {
  reason: string;
}

export interface PhaseQuestion {
  id: string;
  statement: string;
  sequence: number;
  options: Array<{ id: string; label: string }>;
}

export interface TrailPhase {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  kind: string;
  xpReward: number;
  passingScore: number;
  unitTitle: string;
  resources: PhaseResource[];
  extraResources: PhaseExtraResource[];
  /** Sorteadas do banco da fase a cada visita; `sequence` é a posição na prova. */
  questions: PhaseQuestion[];
}

export class TrailPhaseError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TrailPhaseError";
    this.status = status;
  }
}

async function request<T>(path: string, token: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar sua trilha agora.";
    let message = fallback;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // resposta sem corpo JSON: fica a mensagem padrão
    }
    throw new TrailPhaseError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function fetchTrailMap(token: string): Promise<TrailMap> {
  return request<TrailMap>("/api/trails/map", token);
}

/**
 * Timeout generoso: na primeira visita de uma fase a prova pode estar sendo
 * gerada por IA. Depois disso vem do cache do servidor em milissegundos.
 */
export async function fetchTrailPhase(token: string, lessonId: string): Promise<TrailPhase> {
  return request<TrailPhase>(`/api/trails/phases/${lessonId}`, token, 95000);
}
