import assert from "node:assert/strict";
import test from "node:test";
import type { TrailMapPhase, TrailMapUnit } from "@/shared/api/trailMapApi";
import {
  BUBBLE_SLOT,
  focusedUnitId,
  isSegmentReached,
  isUnitExpandedByDefault,
  layoutPhasePath,
  LABEL_SLOT,
  NODE_SLOT,
  PATH_WIDTH,
  phaseLabel,
  ROW_GAP,
  segmentPath,
  unitState,
} from "./trailMapLayout";

function phase(id: string, status: TrailMapPhase["status"]): TrailMapPhase {
  return {
    id,
    title: id,
    description: null,
    sequence: 1,
    kind: "STANDARD",
    xpReward: 20,
    passingScore: 60,
    status,
    unlocked: status !== "locked",
    stars: 0,
    bestPercentage: 0,
    attempts: 0,
    resourceCount: 1,
  };
}

function unit(id: string, phases: TrailMapPhase[]): TrailMapUnit {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  return {
    id,
    title: id,
    sequence: 1,
    phases,
    completedPhases,
    totalPhases: phases.length,
    progressPercentage: Math.round((completedPhases / phases.length) * 100),
  };
}

test("o trilho passa pelo centro de cada nó, com espaço extra para o balão da fase atual", () => {
  const layout = layoutPhasePath([
    phase("a", "completed"),
    phase("b", "current"),
    phase("c", "locked"),
  ]);

  const plainRow = NODE_SLOT + LABEL_SLOT;
  assert.equal(layout.points[0]?.y, NODE_SLOT / 2);
  assert.equal(layout.points[0]?.x, PATH_WIDTH / 2, "a primeira fase começa no centro");
  assert.equal(layout.rows[1]?.hasBubble, true);
  assert.equal(layout.points[1]?.y, plainRow + ROW_GAP + BUBBLE_SLOT + NODE_SLOT / 2);
  assert.equal(layout.height, plainRow * 3 + BUBBLE_SLOT + ROW_GAP * 2);
});

test("os nós serpenteiam: fases vizinhas não ficam na mesma coluna", () => {
  const layout = layoutPhasePath(Array.from({ length: 5 }, (_, i) => phase(`p${i}`, "locked")));
  for (let i = 1; i < layout.points.length; i += 1) {
    assert.notEqual(layout.points[i]?.x, layout.points[i - 1]?.x);
  }
});

test("o segmento é uma curva em S que liga os dois centros", () => {
  assert.equal(
    segmentPath({ x: 160, y: 48 }, { x: 96, y: 200 }),
    "M 160 48 C 160 124, 96 124, 96 200",
  );
});

test("o trecho só aparece percorrido até fases liberadas", () => {
  assert.equal(isSegmentReached({ status: "current" }), true);
  assert.equal(isSegmentReached({ status: "available" }), true);
  assert.equal(isSegmentReached({ status: "locked" }), false);
});

test("rótulos numeram a fase na unidade e tiram o prefixo de bônus e chefão", () => {
  assert.equal(phaseLabel("Funções & Arrays", "STANDARD", 2), "3. Funções & Arrays");
  assert.equal(phaseLabel("Baú Bônus: Git e GitHub", "BONUS", 3), "Git e GitHub");
  assert.equal(phaseLabel("Chefão: Projeto Full Stack", "BOSS", 4), "Projeto Full Stack");
});

test("a unidade em destaque é a da fase atual, senão a primeira incompleta", () => {
  const done = unit("u1", [phase("a", "completed")]);
  const active = unit("u2", [phase("b", "completed"), phase("c", "current")]);
  const locked = unit("u3", [phase("d", "locked")]);

  assert.equal(focusedUnitId([done, active, locked], "c"), "u2");
  assert.equal(focusedUnitId([done, locked], null), "u3");
  assert.equal(focusedUnitId([done], null), "u1", "trilha terminada destaca a última");
  assert.equal(focusedUnitId([], null), null);
});

test("estado da unidade: concluída, em andamento ou bloqueada", () => {
  assert.equal(unitState(unit("u1", [phase("a", "completed")])), "done");
  assert.equal(unitState(unit("u2", [phase("a", "completed"), phase("b", "current")])), "active");
  assert.equal(unitState(unit("u3", [phase("a", "locked")])), "locked");
});

test("abrem por padrão só a unidade em foco e a próxima", () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => isUnitExpandedByDefault(index, 1)),
    [false, true, true, false],
  );
});
