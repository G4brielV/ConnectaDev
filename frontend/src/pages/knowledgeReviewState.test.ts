import assert from "node:assert/strict";
import test from "node:test";
import {
  getOptionStatus,
  getReviewButtonState,
  getWrongAnswers,
} from "./knowledgeReviewState";

test("getOptionStatus returns 'default' or 'selected' before confirmation", () => {
  const optA = { id: "A", label: "Opção A" };
  const optB = { id: "B", label: "Opção B" };

  assert.equal(getOptionStatus(optA, null, false, "A"), "default");
  assert.equal(getOptionStatus(optA, "A", false, "A"), "selected");
  assert.equal(getOptionStatus(optB, "A", false, "A"), "default");
});

test("getOptionStatus highlights correct in green, selected wrong in red, and others dimmed after confirmation", () => {
  const optA = { id: "A", label: "Opção A" };
  const optB = { id: "B", label: "Opção B" };
  const optC = { id: "C", label: "Opção C" };

  // User chose B, but A is correct
  assert.equal(getOptionStatus(optA, "B", true, "A"), "correct");
  assert.equal(getOptionStatus(optB, "B", true, "A"), "incorrect");
  assert.equal(getOptionStatus(optC, "B", true, "A"), "dimmed");

  // User chose A, and A is correct
  assert.equal(getOptionStatus(optA, "A", true, "A"), "correct");
  assert.equal(getOptionStatus(optB, "A", true, "A"), "dimmed");
});

test("getReviewButtonState disables button and returns hint when no alternative selected", () => {
  const unselectedState = getReviewButtonState(null, false, false);
  assert.equal(unselectedState.label, "Confirmar Resposta");
  assert.equal(unselectedState.disabled, true);
  assert.equal(unselectedState.canAdvance, false);
  assert.equal(unselectedState.hint, "Selecione uma alternativa antes de continuar");

  const selectedState = getReviewButtonState("A", false, false);
  assert.equal(selectedState.label, "Confirmar Resposta");
  assert.equal(selectedState.disabled, false);
  assert.equal(selectedState.canAdvance, false);
  assert.equal(selectedState.hint, null);
});

test("getReviewButtonState updates label to 'Próxima Pergunta' or 'Finalizar Revisão' after confirmation", () => {
  const intermediateQuestionState = getReviewButtonState("A", true, false);
  assert.equal(intermediateQuestionState.label, "Próxima Pergunta");
  assert.equal(intermediateQuestionState.disabled, false);
  assert.equal(intermediateQuestionState.canAdvance, true);

  const lastQuestionState = getReviewButtonState("A", true, true);
  assert.equal(lastQuestionState.label, "Finalizar Revisão");
  assert.equal(lastQuestionState.disabled, false);
  assert.equal(lastQuestionState.canAdvance, true);
});

test("getWrongAnswers filters only incorrect answers for error review accordion", () => {
  const mockResults = [
    {
      questionId: "q1",
      statement: "P1",
      selectedOptionId: "A",
      correctOptionId: "A",
      isCorrect: true,
      explanation: "Exp1",
    },
    {
      questionId: "q2",
      statement: "P2",
      selectedOptionId: "B",
      correctOptionId: "C",
      isCorrect: false,
      explanation: "Exp2",
    },
    {
      questionId: "q3",
      statement: "P3",
      selectedOptionId: "D",
      correctOptionId: "A",
      isCorrect: false,
      explanation: "Exp3",
    },
  ];

  const wrong = getWrongAnswers(mockResults);
  assert.equal(wrong.length, 2);
  assert.equal(wrong[0].questionId, "q2");
  assert.equal(wrong[1].questionId, "q3");
});
