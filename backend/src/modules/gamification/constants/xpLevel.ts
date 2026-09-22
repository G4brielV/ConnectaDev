export const XP_PER_LEVEL = 100;

export const LEVEL_NAME = "Iniciante Tech";

export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}
