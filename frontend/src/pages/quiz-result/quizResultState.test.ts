import assert from "node:assert/strict";
import test from "node:test";
import { buildQuizResultSummary, pickFirstCourse } from "./quizResultState";

test("buildQuizResultSummary trims, dedupes and drops the main area from the secondary list", () => {
  const summary = buildQuizResultSummary({
    areaPrincipal: " Desenvolvimento Web ",
    areasSecundarias: ["Dados", "Desenvolvimento Web", " Dados ", ""],
    justificativa: "  Você gosta de construir coisas.  ",
    tecnologiasSugeridas: ["React", "react", " ", "React"],
  });

  assert.deepEqual(summary, {
    areaPrincipal: "Desenvolvimento Web",
    areasSecundarias: ["Dados"],
    justificativa: "Você gosta de construir coisas.",
    tecnologias: ["React", "react"],
  });
});

test("pickFirstCourse returns the first course or an empty state", () => {
  const course = {
    id: "c1",
    thumbnail: "https://example.com/a.png",
    title: "Lógica de Programação",
    provider: "YouTube",
    level: "Iniciante",
    external_url: "https://example.com",
    tags: ["lógica"],
  };

  assert.deepEqual(pickFirstCourse([course, { ...course, id: "c2" }]), { status: "ready", course });
  assert.deepEqual(pickFirstCourse([]), { status: "empty" });
});
