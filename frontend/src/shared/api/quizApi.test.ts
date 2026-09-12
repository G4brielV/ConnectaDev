import assert from "node:assert/strict";
import test from "node:test";
import { fetchQuizQuestions } from "./quizApi";

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
