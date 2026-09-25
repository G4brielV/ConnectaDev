import assert from "node:assert/strict";
import test from "node:test";
import {
  answeredCount,
  buildResultHeadline,
  canSubmitExam,
  examProgressPercentage,
  firstUnansweredIndex,
  getExamButtonLabel,
  isLastQuestion,
} from "./phaseExamState";

const questions = [
  { id: "q1", statement: "a", sequence: 1, options: [] },
  { id: "q2", statement: "b", sequence: 2, options: [] },
];

test("a prova só pode ser enviada com todas as questões respondidas", () => {
  assert.equal(canSubmitExam(questions, {}), false);
  assert.equal(canSubmitExam(questions, { q1: "A" }), false);
  assert.equal(canSubmitExam(questions, { q1: "A", q2: "B" }), true);
});

test("uma prova sem questões nunca é enviável", () => {
  assert.equal(canSubmitExam([], {}), false);
});

test("conta quantas questões já foram respondidas", () => {
  assert.equal(answeredCount(questions, {}), 0);
  assert.equal(answeredCount(questions, { q1: "A" }), 1);
  assert.equal(answeredCount(questions, { q1: "A", q2: "C" }), 2);
});

test("a manchete do resultado acompanha aprovação e estrelas", () => {
  assert.equal(buildResultHeadline(false, 0), "Quase lá!");
  assert.equal(buildResultHeadline(true, 1), "Fase concluída!");
  assert.equal(buildResultHeadline(true, 2), "Muito bem!");
  assert.equal(buildResultHeadline(true, 3), "Perfeito!");
});

test("o botão principal cobra resposta, avança e finaliza na última", () => {
  assert.equal(getExamButtonLabel(0, 10, false), "Selecione uma alternativa");
  assert.equal(getExamButtonLabel(0, 10, true), "Próxima pergunta");
  assert.equal(getExamButtonLabel(8, 10, true), "Próxima pergunta");
  assert.equal(getExamButtonLabel(9, 10, true), "Finalizar prova");
});

test("identifica a última pergunta", () => {
  assert.equal(isLastQuestion(9, 10), true);
  assert.equal(isLastQuestion(8, 10), false);
  assert.equal(isLastQuestion(0, 0), false, "prova vazia não tem última");
});

test("a barra conta a pergunta atual, não as respondidas", () => {
  assert.equal(examProgressPercentage(0, 10), 10);
  assert.equal(examProgressPercentage(4, 10), 50);
  assert.equal(examProgressPercentage(9, 10), 100);
  assert.equal(examProgressPercentage(0, 0), 0);
});

test("aponta a primeira pergunta em branco para quem pulou alguma", () => {
  assert.equal(firstUnansweredIndex(questions, { q1: "A", q2: "B" }), -1);
  assert.equal(firstUnansweredIndex(questions, { q2: "B" }), 0);
  assert.equal(firstUnansweredIndex(questions, { q1: "A" }), 1);
});
