import assert from "node:assert/strict";
import test from "node:test";
import { fetchQuizDiagnosis, fetchQuizQuestions } from "./quizApi";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("returns an empty array when the API catalog is empty", async () => {
  globalThis.fetch = async () =>
    new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });

  assert.deepEqual(await fetchQuizQuestions("token"), []);
});

test("normalizes question types and preserves validation metadata", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          id: "question-1",
          statement: "Choose one",
          type: "MULTIPLE_CHOICE",
          sequence: 1,
          isActive: true,
          options: [{ id: "option-1", label: "Option" }],
        },
        {
          id: "question-2",
          statement: "Tell us more",
          type: "OPEN_TEXT",
          sequence: 2,
          isActive: true,
          validation: { minLength: 20, maxLength: 500 },
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  assert.deepEqual(await fetchQuizQuestions("token"), [
    {
      id: "question-1",
      prompt: "Choose one",
      type: "MULTIPLE_CHOICE",
      sequence: 1,
      isActive: true,
      options: [{ id: "option-1", label: "Option" }],
      validation: undefined,
    },
    {
      id: "question-2",
      prompt: "Tell us more",
      type: "OPEN_TEXT",
      sequence: 2,
      isActive: true,
      options: undefined,
      validation: { minLength: 20, maxLength: 500 },
    },
  ]);
});

test("rejects network and server failures for the retry flow", async () => {
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };
  await assert.rejects(() => fetchQuizQuestions("token"));

  globalThis.fetch = async () => new Response("error", { status: 504 });
  await assert.rejects(() => fetchQuizQuestions("token"));
});

test("fetchQuizDiagnosis sends the bearer token and returns the parsed status", async () => {
  const seen: { url: string; authorization: string | null }[] = [];
  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    seen.push({ url: String(input), authorization: headers.get("Authorization") });
    return new Response(
      JSON.stringify({ completed: true, areaPrincipal: "Dados", tecnologiasSugeridas: ["SQL"] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const status = await fetchQuizDiagnosis("token-1");

  assert.equal(seen[0]?.url.endsWith("/api/quiz/diagnosis"), true);
  assert.equal(seen[0]?.authorization, "Bearer token-1");
  assert.deepEqual(status, { completed: true, areaPrincipal: "Dados", tecnologiasSugeridas: ["SQL"] });
});

test("fetchQuizDiagnosis maps 401 to the session message", async () => {
  globalThis.fetch = async () => new Response("", { status: 401 });

  await assert.rejects(() => fetchQuizDiagnosis("token"), {
    message: "Sua sessão não é válida. Faça login para continuar.",
  });
});

test("fetchQuizDiagnosis maps other failures to a generic message", async () => {
  globalThis.fetch = async () => new Response("", { status: 500 });

  await assert.rejects(() => fetchQuizDiagnosis("token"), {
    message: "Não foi possível consultar seu diagnóstico vocacional.",
  });
});
