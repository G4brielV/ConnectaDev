import assert from "node:assert/strict";
import test from "node:test";
import { getQuizCatalogState } from "./quizState";

test("returns empty when the API catalog has no questions", () => {
  assert.equal(getQuizCatalogState([]), "empty");
});

test("returns ready when at least one question is available", () => {
  assert.equal(
    getQuizCatalogState([
      {
        id: "question-1",
        prompt: "Question",
        type: "OPEN_TEXT",
        sequence: 1,
        isActive: true,
      },
    ]),
    "ready",
  );
});
