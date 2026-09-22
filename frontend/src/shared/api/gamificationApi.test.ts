import assert from "node:assert/strict";
import test from "node:test";
import { fetchGamificationSummary } from "./gamificationApi";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("fetchGamificationSummary returns the user's XP and streak on success", async () => {
  let receivedAuth: string | null = null;
  globalThis.fetch = async (_input, init) => {
    receivedAuth = (init?.headers as Record<string, string>)?.Authorization ?? null;
    return new Response(
      JSON.stringify({
        totalXp: 120,
        currentLevel: 2,
        levelName: "Iniciante Tech",
        currentStreak: 3,
        longestStreak: 7,
        lastActivityDate: "2026-09-17T10:00:00.000Z",
        completedReviews: 4,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const summary = await fetchGamificationSummary("mock-token");
  assert.equal(receivedAuth, "Bearer mock-token");
  assert.equal(summary.totalXp, 120);
  assert.equal(summary.currentLevel, 2);
  assert.equal(summary.currentStreak, 3);
  assert.equal(summary.completedReviews, 4);
});

test("fetchGamificationSummary throws a descriptive error on 401", async () => {
  globalThis.fetch = async () => new Response("Unauthorized", { status: 401 });
  await assert.rejects(
    () => fetchGamificationSummary("mock-token"),
    { message: "Sua sessão não é válida. Faça login para continuar." },
  );
});
