import { API_URL } from "../config/api";

export interface GamificationSummary {
  totalXp: number;
  currentLevel: number;
  levelName?: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedReviews: number;
}

/** Linhas do extrato de XP de uma atividade (XP base e bônus). */
export type XpItemKind =
  | "LESSON"
  | "PRACTICE"
  | "REVIEW"
  | "PERFECT"
  | "COMBO"
  | "STREAK_DAILY"
  | "STREAK_MILESTONE";

export interface XpBreakdownItem {
  kind: XpItemKind;
  amount: number;
}

/**
 * O que a atividade fez com a ofensiva: começou do zero, subiu, recomeçou
 * depois de perder dias, ou já tinha sido garantida hoje.
 */
export type StreakStatus = "STARTED" | "INCREMENTED" | "RESTARTED" | "KEPT";

/** Marco da ofensiva batido hoje (3, 7, 14 ou 30 dias). */
export interface StreakMilestoneReward {
  days: number;
  title: string;
  xp: number;
}

export interface ExamReviewItem {
  questionId: string;
  statement: string;
  options: Array<{ id: string; label: string }>;
  /** null quando a pergunta ficou em branco (lições antigas). */
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface ScoreLessonResult {
  totalXp: number;
  currentLevel: number;
  levelName?: string;
  correctCount: number;
  totalQuestions: number;
  /** Total ganho nesta tentativa, bônus inclusos; o detalhe está em `xpBreakdown`. */
  xpEarned: number;
  xpBreakdown: XpBreakdownItem[];
  leveledUp: boolean;
  alreadyRewarded: boolean;
  /** Percentual de acerto e nota de corte da fase */
  percentage: number;
  passingScore: number;
  /** Aprovado no gate: libera a fase seguinte */
  passed: boolean;
  stars: number;
  /** Acertou todas nesta tentativa: selo "Perfeito! 🎯". */
  perfect: boolean;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  streakMilestone: StreakMilestoneReward | null;
  /** Correção pergunta a pergunta, com explicação */
  review: ExamReviewItem[];
  /** @deprecated use `passed` */
  completed: boolean;
}

export class ScoreLessonError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ScoreLessonError";
    this.status = status;
  }
}

export async function fetchGamificationSummary(
  token: string,
): Promise<GamificationSummary> {
  const response = await fetch(`${API_URL}/api/gamification/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar seu progresso.",
    );
  }

  return (await response.json()) as GamificationSummary;
}

export async function scoreLesson(
  token: string,
  lessonId: string,
  answers: Record<string, string>,
): Promise<ScoreLessonResult> {
  const response = await fetch(`${API_URL}/api/trails/lessons/${lessonId}/score`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    // O backend explica o motivo (ex.: 403 de fase ainda bloqueada);
    // repassar a mensagem dele evita um erro genérico na tela.
    let message = "Não foi possível registrar sua pontuação.";
    try {
      const body = (await response.clone().json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // sem corpo JSON: fica a mensagem padrão
    }
    throw new ScoreLessonError(
      message,
      response.status,
    );
  }

  return (await response.json()) as ScoreLessonResult;
}
