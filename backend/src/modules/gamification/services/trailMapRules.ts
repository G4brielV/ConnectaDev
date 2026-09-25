
export type PhaseStatus = "completed" | "current" | "locked";

export interface PhaseProgress {
  passed: boolean;
  stars: number;
  bestPercentage: number;
  attempts: number;
}

export interface PhaseInput {
  id: string;
  sequence: number;
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


export function resolvePhaseStates(phases: PhaseInput[]): PhaseState[] {
  const ordered = [...phases].sort((a, b) => a.sequence - b.sequence);
  let previousPassed = true;
  let currentTaken = false;

  return ordered.map((phase) => {
    const passed = phase.progress?.passed ?? false;
    const unlocked = previousPassed;

    let status: PhaseStatus;
    if (passed) {
      status = "completed";
    } else if (unlocked && !currentTaken) {
      status = "current";
      currentTaken = true;
    } else {
      status = "locked";
    }

    previousPassed = passed;
    return { ...phase, unlocked, status };
  });
}

export function isPhaseUnlocked(phases: PhaseInput[], lessonId: string): boolean {
  const state = resolvePhaseStates(phases).find((phase) => phase.id === lessonId);
  return state?.unlocked ?? false;
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
