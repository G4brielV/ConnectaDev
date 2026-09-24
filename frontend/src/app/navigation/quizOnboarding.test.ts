import assert from "node:assert/strict";
import test from "node:test";
import {
  QUIZ_ONBOARDING_STATE,
  checkQuizOnboarding,
  needsQuizOnboarding,
  resolveInitialNavigationState,
} from "./quizOnboarding";

test("needsQuizOnboarding is true only when the diagnosis is not completed", () => {
  assert.equal(
    needsQuizOnboarding({ completed: false, areaPrincipal: null, tecnologiasSugeridas: [] }),
    true,
  );
  assert.equal(
    needsQuizOnboarding({ completed: true, areaPrincipal: "Dados", tecnologiasSugeridas: ["SQL"] }),
    false,
  );
});

test("checkQuizOnboarding forwards the token and maps the API status", async () => {
  const seenTokens: string[] = [];
  const needs = await checkQuizOnboarding("token-1", async (token) => {
    seenTokens.push(token);
    return { completed: false, areaPrincipal: null, tecnologiasSugeridas: [] };
  });

  assert.deepEqual(seenTokens, ["token-1"]);
  assert.equal(needs, true);
});

test("checkQuizOnboarding fails open (no onboarding) when the API call throws", async () => {
  const needs = await checkQuizOnboarding("token-1", async () => {
    throw new Error("network down");
  });

  assert.equal(needs, false);
});

test("resolveInitialNavigationState stacks QuizIntro on top of Home only when needed", () => {
  assert.deepEqual(resolveInitialNavigationState(true, true), QUIZ_ONBOARDING_STATE);
  assert.equal(resolveInitialNavigationState(true, false), undefined);
  assert.equal(resolveInitialNavigationState(true, null), undefined);
  assert.equal(resolveInitialNavigationState(false, true), undefined);
});

test("QUIZ_ONBOARDING_STATE keeps Home as the base route and QuizIntro focused", () => {
  assert.deepEqual(
    QUIZ_ONBOARDING_STATE.routes.map((route) => route.name),
    ["Home", "QuizIntro"],
  );
  assert.equal(QUIZ_ONBOARDING_STATE.index, 1);
});
