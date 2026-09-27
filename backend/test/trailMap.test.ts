import assert from "node:assert/strict";
import test from "node:test";
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

  assert.deepEqual(
    states.map((s) => s.status),
    ["current", "locked", "locked"],
  );
  assert.deepEqual(
    states.map((s) => s.unlocked),
    [true, false, false],
  );
});

test("aprovar uma fase libera exatamente a seguinte", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("b", 2, null),
    phase("c", 3, null),
  ]);

  assert.deepEqual(
    states.map((s) => s.status),
    ["completed", "current", "locked"],
  );
});

test("reprovar não libera a próxima fase", () => {
  const states = resolvePhaseStates([
    phase("a", 1, failed),
    phase("b", 2, null),
  ]);

  assert.deepEqual(
    states.map((s) => s.status),
    ["current", "locked"],
  );
  assert.equal(isPhaseUnlocked([phase("a", 1, failed), phase("b", 2, null)], "b"), false);
});

test("só existe uma fase atual, mesmo com buraco no progresso", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("b", 2, passed),
    phase("c", 3, null),
    phase("d", 4, null),
  ]);

  assert.equal(states.filter((s) => s.status === "current").length, 1);
  assert.equal(states.find((s) => s.status === "current")?.id, "c");
});

test("a ordem vem da sequence, não da ordem do array", () => {
  const states = resolvePhaseStates([
    phase("c", 3, null),
    phase("a", 1, passed),
    phase("b", 2, null),
  ]);

  assert.deepEqual(
    states.map((s) => s.id),
    ["a", "b", "c"],
  );
  assert.equal(states[1]?.status, "current");
});

test("uma trilha inteira concluída não tem fase atual", () => {
  const states = resolvePhaseStates([phase("a", 1, passed), phase("b", 2, passed)]);
  assert.equal(states.some((s) => s.status === "current"), false);
});

test("o baú bônus não trava a trilha: a fase seguinte abre sem ele", () => {
  const states = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, null, "BONUS"),
    phase("boss", 3, null, "BOSS"),
  ]);

  assert.deepEqual(
    states.map((s) => s.status),
    ["completed", "available", "current"],
  );
  assert.equal(isPhaseUnlocked(states, "boss"), true);
});

test("o baú bônus só abre depois da fase obrigatória anterior", () => {
  const states = resolvePhaseStates([
    phase("a", 1, failed),
    phase("bonus", 2, null, "BONUS"),
    phase("b", 3, null),
  ]);

  assert.deepEqual(
    states.map((s) => s.status),
    ["current", "locked", "locked"],
  );
});

test("reprovar no bônus não bloqueia nada e aprovar nele o conclui", () => {
  const skipped = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, failed, "BONUS"),
    phase("b", 3, null),
  ]);
  assert.equal(skipped.find((s) => s.id === "b")?.status, "current");

  const done = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, passed, "BONUS"),
    phase("b", 3, null),
  ]);
  assert.equal(done.find((s) => s.id === "bonus")?.status, "completed");
});

test("a trilha termina com as obrigatórias aprovadas, mesmo sem o bônus", () => {
  const withoutBonus = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, null, "BONUS"),
    phase("boss", 3, passed, "BOSS"),
  ]);
  assert.equal(isTrailFinished(withoutBonus), true);

  const missingBoss = resolvePhaseStates([
    phase("a", 1, passed),
    phase("bonus", 2, passed, "BONUS"),
    phase("boss", 3, null, "BOSS"),
  ]);
  assert.equal(isTrailFinished(missingBoss), false);
  assert.equal(isTrailFinished([]), false);
});

test("estrelas seguem o desempenho e exigem aprovação", () => {
  assert.equal(calculateStars(100, 60), 3);
  assert.equal(calculateStars(80, 60), 2);
  assert.equal(calculateStars(79, 60), 1);
  assert.equal(calculateStars(60, 60), 1, "exatamente na nota de corte já aprova");
  assert.equal(calculateStars(59, 60), 0);
  assert.equal(calculateStars(0, 60), 0);
});

test("percentual arredonda e tolera lição sem questão", () => {
  assert.equal(calculatePercentage(1, 3), 33);
  assert.equal(calculatePercentage(2, 3), 67);
  assert.equal(calculatePercentage(5, 5), 100);
  assert.equal(calculatePercentage(0, 0), 0);
});
