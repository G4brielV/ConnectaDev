import { expect, test } from "vitest";
import {
  calculatePercentage,
  calculateStars,
  isPhaseUnlocked,
  isTrailFinished,
  resolvePhaseStates,
} from "../src/modules/gamification/services/trailMapRules";

const passed = { passed: true, stars: 3, bestPercentage: 100, attempts: 1 };
const failed = { passed: false, stars: 0, bestPercentage: 20, attempts: 1 };

function phase(
  id: string,
  sequence: number,
  progress: typeof passed | typeof failed | null,
  kind = "STANDARD",
) {
  return { id, sequence, kind, progress };
}

test("a primeira fase abre para quem nunca jogou e o resto fica travado", () => {
  const states = resolvePhaseStates([
    phase("a", 1, null),
    phase("b", 2, null),
    phase("c", 3, null),
  ]);

  expect(states.map((s) => s.status)).toEqual(["current", "locked", "locked"]);
  expect(states.map((s) => s.unlocked)).toEqual([true, false, false]);
});

test("aprovar uma fase libera exatamente a seguinte", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("b", 2, null),
    phase("c", 3, null),
  ]);

  expect(states.map((s) => s.status)).toEqual(["completed", "current", "locked"]);
});

test("reprovar não libera a próxima fase", () => {
  const states = resolvePhaseStates([
    phase("a", 1, failed),
    phase("b", 2, null),
  ]);

  expect(states.map((s) => s.status)).toEqual(["current", "locked"]);
  expect(isPhaseUnlocked([phase("a", 1, failed), phase("b", 2, null)], "b")).toBe(false);
});

test("só existe uma fase atual, mesmo com buraco no progresso", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("b", 2, passed),
    phase("c", 3, null),
    phase("d", 4, null),
  ]);

  expect(states.filter((s) => s.status === "current").length).toBe(1);
  expect(states.find((s) => s.status === "current")?.id).toBe("c");
});

test("a ordem vem da sequence, não da ordem do array", () => {
  const states = resolvePhaseStates([
    phase("c", 3, null),
    phase("a", 1, passed),
    phase("b", 2, null),
  ]);

  expect(states.map((s) => s.id)).toEqual(["a", "b", "c"]);
  expect(states[1]?.status).toBe("current");
});

test("uma trilha inteira concluída não tem fase atual", () => {
  const states = resolvePhaseStates([phase("a", 1, passed), phase("b", 2, passed)]);
  expect(states.some((s) => s.status === "current")).toBe(false);
});

test("o baú bônus não trava a trilha: a fase seguinte abre sem ele", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, null, "BONUS"),
    phase("boss", 3, null, "BOSS"),
  ]);

  expect(states.map((s) => s.status)).toEqual(["completed", "available", "current"]);
  expect(isPhaseUnlocked(states, "boss")).toBe(true);
});

test("o baú bônus só abre depois da fase obrigatória anterior", () => {
  const states = resolvePhaseStates([
    phase("a", 1, failed),
    phase("bonus", 2, null, "BONUS"),
    phase("b", 3, null),
  ]);

  expect(states.map((s) => s.status)).toEqual(["current", "locked", "locked"]);
});

test("reprovar no bônus não bloqueia nada e aprovar nele o conclui", () => {
  const skipped = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, failed, "BONUS"),
    phase("b", 3, null),
  ]);
  expect(skipped.find((s) => s.id === "b")?.status).toBe("current");

  const done = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, passed, "BONUS"),
    phase("b", 3, null),
  ]);
  expect(done.find((s) => s.id === "bonus")?.status).toBe("completed");
});

test("a trilha termina com as obrigatórias aprovadas, mesmo sem o bônus", () => {
  const withoutBonus = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, null, "BONUS"),
    phase("boss", 3, passed, "BOSS"),
  ]);
  expect(isTrailFinished(withoutBonus)).toBe(true);

  const missingBoss = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, passed, "BONUS"),
    phase("boss", 3, null, "BOSS"),
  ]);
  expect(isTrailFinished(missingBoss)).toBe(false);
  expect(isTrailFinished([])).toBe(false);
});

test("estrelas seguem o desempenho e exigem aprovação", () => {
  expect(calculateStars(100, 60)).toBe(3);
  expect(calculateStars(80, 60)).toBe(2);
  expect(calculateStars(79, 60)).toBe(1);
  expect(calculateStars(60, 60), "exatamente na nota de corte já aprova").toBe(1);
  expect(calculateStars(59, 60)).toBe(0);
  expect(calculateStars(0, 60)).toBe(0);
});

test("percentual arredonda e tolera lição sem questão", () => {
  expect(calculatePercentage(1, 3)).toBe(33);
  expect(calculatePercentage(2, 3)).toBe(67);
  expect(calculatePercentage(5, 5)).toBe(100);
  expect(calculatePercentage(0, 0)).toBe(0);
});
