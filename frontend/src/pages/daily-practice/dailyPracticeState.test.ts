import assert from "node:assert/strict";
import test from "node:test";
import {
  comboLabel,
  currentCombo,
  optionTone,
  practiceButtonLabel,
  practiceHeadline,
  practiceProgressPercentage,
  practiceRewardMessage,
} from "./dailyPracticeState";

test("o botão cobra a resposta, verifica e depois avança", () => {
  assert.equal(
    practiceButtonLabel({ hasSelection: false, hasFeedback: false, isLast: false }),
    "Selecione uma alternativa",
  );
  assert.equal(practiceButtonLabel({ hasSelection: true, hasFeedback: false, isLast: false }), "Verificar");
  assert.equal(practiceButtonLabel({ hasSelection: true, hasFeedback: true, isLast: false }), "Continuar");
  assert.equal(practiceButtonLabel({ hasSelection: true, hasFeedback: true, isLast: true }), "Ver resultado");
});

test("a barra só enche quando a pergunta é verificada", () => {
  assert.equal(practiceProgressPercentage(0, 5, false), 0);
  assert.equal(practiceProgressPercentage(0, 5, true), 20);
  assert.equal(practiceProgressPercentage(4, 5, true), 100);
  assert.equal(practiceProgressPercentage(0, 0, true), 0);
});

test("o título do resultado acompanha os acertos", () => {
  assert.equal(practiceHeadline(5, 5), "Perfeito!");
  assert.equal(practiceHeadline(3, 5), "Mandou bem!");
  assert.equal(practiceHeadline(1, 5), "Bom treino!");
  assert.equal(practiceHeadline(0, 5), "Todo erro ensina!");
});

test("a mensagem explica o XP da prática, inclusive no treino livre", () => {
  assert.match(
    practiceRewardMessage({
      rewarded: true,
      xpBreakdown: [
        { kind: "PRACTICE", amount: 8 },
        { kind: "STREAK_DAILY", amount: 5 },
      ],
    }),
    /\+8 XP/,
  );
  // Só o bônus de ofensiva: a prática em si não pagou nada.
  assert.match(
    practiceRewardMessage({ rewarded: true, xpBreakdown: [{ kind: "STREAK_DAILY", amount: 5 }] }),
    /Amanhã/,
  );
  assert.match(practiceRewardMessage({ rewarded: false, xpBreakdown: [] }), /Treino livre/);
});

test("o combo conta os acertos seguidos e zera no erro", () => {
  assert.equal(currentCombo([]), 0);
  assert.equal(currentCombo([true, true, true]), 3);
  assert.equal(currentCombo([true, true, false]), 0);
  assert.equal(currentCombo([true, false, true, true]), 2);
});

test("o indicador de combo só aparece a partir de 3 seguidas", () => {
  assert.equal(comboLabel(2), null);
  assert.equal(comboLabel(3), "Combo x3! 🔥");
  assert.equal(comboLabel(5), "Combo x5! 🔥");
});

test("depois da correção, a certa fica verde e a escolhida errada vermelha", () => {
  assert.equal(optionTone("A", null, null), "idle");
  assert.equal(optionTone("A", "A", null), "selected");

  const wrong = { selectedOptionId: "B", correctOptionId: "C" };
  assert.equal(optionTone("C", "B", wrong), "correct");
  assert.equal(optionTone("B", "B", wrong), "wrong");
  assert.equal(optionTone("A", "B", wrong), "dimmed");

  const right = { selectedOptionId: "C", correctOptionId: "C" };
  assert.equal(optionTone("C", "C", right), "correct");
});
