import assert from "node:assert/strict";
import test from "node:test";
import { fetchReviewQuestions, submitReview } from "./reviewApi";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("fetchReviewQuestions returns session and question data on success", async () => {
  const mockPayload = {
    sessionId: "sess-123",
    topicId: "topic-1",
    topicTitle: "Fundamentos de Programação",
    questions: [
      {
        id: "q-1",
        statement: "O que é uma variável?",
        sequence: 1,
        options: [
          { id: "A", label: "Loop" },
          { id: "B", label: "Armazenamento" },
        ],
        correctOptionId: "B",
        explanation: "Variáveis armazenam dados.",
      },
    ],
  };

  globalThis.fetch = async () =>
    new Response(JSON.stringify(mockPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const data = await fetchReviewQuestions("mock-token", "topic-1");
  assert.equal(data.sessionId, "sess-123");
  assert.equal(data.topicId, "topic-1");
  assert.equal(data.questions.length, 1);
  assert.equal(data.questions[0].correctOptionId, "B");
});

test("fetchReviewQuestions throws descriptive error on 401 or 404", async () => {
  globalThis.fetch = async () => new Response("Unauthorized", { status: 401 });
  await assert.rejects(
    () => fetchReviewQuestions("mock-token", "topic-1"),
    { message: "Sua sessão expirou. Faça login para continuar." },
  );

  globalThis.fetch = async () => new Response("Not Found", { status: 404 });
  await assert.rejects(
    () => fetchReviewQuestions("mock-token", "topic-1"),
    { message: "Tópico de revisão não encontrado." },
  );
});

test("submitReview posts answers and returns gamification summary on HTTP 200", async () => {
  const mockSubmitResult = {
    sessionId: "sess-123",
    topicId: "topic-1",
    topicTitle: "Fundamentos",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    xpEarned: 40,
    totalXp: 140,
    currentStreak: 3,
    longestStreak: 5,
    streakIncremented: true,
    results: [],
  };

  globalThis.fetch = async () =>
    new Response(JSON.stringify(mockSubmitResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const result = await submitReview("mock-token", "sess-123", [
    { questionId: "q-1", selectedOptionId: "B" },
  ]);

  assert.equal(result.score, 4);
  assert.equal(result.xpEarned, 40);
  assert.equal(result.percentage, 80);
  assert.equal(result.currentStreak, 3);
});

test("submitReview rejects network/server failure so client can preserve state (Cenário 7)", async () => {
  globalThis.fetch = async () => new Response("Server Error", { status: 500 });

  await assert.rejects(
    () => submitReview("mock-token", "sess-123", [{ questionId: "q-1", selectedOptionId: "B" }]),
    { message: "Não foi possível salvar seu resultado. Verifique sua conexão" },
  );
});

test("submitReview throws a specific error when the session was already finalized (409)", async () => {
  globalThis.fetch = async () => new Response("Conflict", { status: 409 });
  await assert.rejects(
    () => submitReview("mock-token", "sess-123", [{ questionId: "q-1", selectedOptionId: "A" }]),
    { message: "Esta revisão já foi finalizada. Inicie uma nova revisão para continuar." },
  );
});
