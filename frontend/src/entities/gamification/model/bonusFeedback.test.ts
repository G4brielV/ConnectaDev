import assert from "node:assert/strict";
import test from "node:test";
import {
  milestoneHeadline,
  milestoneMessage,
  streakFeedback,
  totalXpOf,
  xpItemLabel,
} from "./bonusFeedback";

test("o extrato nomeia cada linha e soma o total", () => {
  const items = [
    { kind: "LESSON" as const, amount: 50 },
    { kind: "PERFECT" as const, amount: 25 },
  ];
  assert.equal(xpItemLabel("LESSON"), "XP da Lição");
  assert.equal(xpItemLabel("PERFECT"), "Bônus Gabarito");
  assert.equal(totalXpOf(items), 75);
  assert.equal(totalXpOf([]), 0);
});

test("manter a ofensiva mostra a chama e o bônus do dia", () => {
  assert.equal(
    streakFeedback("INCREMENTED", 3, [{ kind: "STREAK_DAILY", amount: 5 }]),
    "Chama acesa! 🔥 3 dias seguidos de foco! +5 XP de bônus diário",
  );
});

test("segunda atividade do dia avisa que a ofensiva já está garantida", () => {
  assert.equal(streakFeedback("KEPT", 3, []), "Ofensiva do dia já garantida! 🔥");
});

test("voltar depois de perder a ofensiva reacende no dia 1", () => {
  assert.match(streakFeedback("RESTARTED", 1, []), /Que bom ter você de volta!.*Dia 1 🔥/);
  assert.match(streakFeedback("STARTED", 1, []), /Dia 1 🔥/);
});

test("o marco de 7 dias comemora a semana e mostra o bônus", () => {
  const milestone = { days: 7, title: "Fogo!", xp: 30 };
  assert.equal(milestoneHeadline(milestone), "Uma semana em chamas! 🔥");
  assert.equal(
    milestoneMessage(milestone),
    "Você completou 7 dias seguidos de estudos e ganhou +30 XP de bonificação especial!",
  );
});
