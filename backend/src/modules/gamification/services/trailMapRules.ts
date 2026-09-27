/**
 * "available" é exclusivo do baú bônus: liberado, mas opcional — não trava
 * a trilha e por isso nunca disputa o posto de fase atual.
 */
export type PhaseStatus = "completed" | "current" | "available" | "locked";

export interface PhaseProgress {
  passed: boolean;
  stars: number;
  bestPercentage: number;
  attempts: number;
}

export interface PhaseInput {
  id: string;
  sequence: number;
  kind: string;
  progress: PhaseProgress | null;
}

export interface PhaseState extends PhaseInput {
  status: PhaseStatus;
  unlocked: boolean;
}

export const EMPTY_PROGRESS: PhaseProgress = {
  passed: false,
  stars: 0,
  bestPercentage: 0,
  attempts: 0,
};

/** O baú bônus é extra: aprovar nele dá XP, mas não é pré-requisito de nada. */
export function isRequiredPhase(kind: string): boolean {
  return kind !== "BONUS";
}

export function resolvePhaseStates(phases: PhaseInput[]): PhaseState[] {
  const ordered = [...phases].sort((a, b) => a.sequence - b.sequence);
  // Só fases obrigatórias movem o gate; o bônus herda a liberação da anterior.
  let previousRequiredPassed = true;
  let currentTaken = false;

  return ordered.map((phase) => {
    const passed = phase.progress?.passed ?? false;
    const unlocked = previousRequiredPassed;
    const required = isRequiredPhase(phase.kind);

    let status: PhaseStatus;
    if (passed) {
      status = "completed";
    } else if (!unlocked) {
      status = "locked";
    } else if (!required) {
      status = "available";
    } else if (!currentTaken) {
      status = "current";
      currentTaken = true;
    } else {
      status = "locked";
    }

    if (required) previousRequiredPassed = passed;
    return { ...phase, unlocked, status };
  });
}

export function isPhaseUnlocked(phases: PhaseInput[], lessonId: string): boolean {
  const state = resolvePhaseStates(phases).find((phase) => phase.id === lessonId);
  return state?.unlocked ?? false;
}

/** A trilha termina quando todas as obrigatórias foram aprovadas; bônus é opcional. */
export function isTrailFinished(states: PhaseState[]): boolean {
  const required = states.filter((phase) => isRequiredPhase(phase.kind));
  return required.length > 0 && required.every((phase) => phase.status === "completed");
}

export function calculateStars(percentage: number, passingScore: number): number {
  if (percentage < passingScore) return 0;
  if (percentage >= 100) return 3;
  if (percentage >= 80) return 2;
  return 1;
}

export function calculatePercentage(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}
