import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { getQuizQuestionsController } from "../src/modules/quiz/controllers/getQuizQuestions.controller";
import { getQuizQuestions } from "../src/modules/quiz/services/getQuizQuestions.service";

test("queries only active questions in ascending sequence order", async () => {
  const calls: unknown[] = [];
  const repository = {
    findMany: async (args: unknown) => {
      calls.push(args);
      return [
    {
      id: "question-1",
      statement: "Choose one",
      type: "MULTIPLE_CHOICE",
      sequence: 1,
      isActive: true,
      options: [{ id: "option-1", label: "Option" }],
      validation: null,
    },
      ];
    },
  };

  const questions = await getQuizQuestions(repository);

  assert.deepEqual(calls[0], {
    where: { isActive: true },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      statement: true,
      type: true,
      sequence: true,
      isActive: true,
      options: true,
      validation: true,
    },
  });
  assert.equal(questions[0]?.type, "MULTIPLE_CHOICE");
});

test("returns an empty array when no active questions exist", async () => {
  assert.deepEqual(
    await getQuizQuestions({ findMany: async () => [] }),
    [],
  );
});

test("returns HTTP 200 with an array for an authenticated request", async () => {
  const send = mock.fn((payload: unknown) => payload);
  const status = mock.fn(() => ({ send }));

  await getQuizQuestionsController(
    { headers: { authorization: "Bearer token" } } as never,
    { status } as never,
    async () => [],
    async () => ({ user: { id: "user-1" } }) as never,
  );

  assert.equal(status.mock.calls[0]?.arguments[0], 200);
  assert.deepEqual(send.mock.calls[0]?.arguments[0], []);
});

test("rejects unauthenticated requests", async () => {
  await assert.rejects(
    () =>
      getQuizQuestionsController(
        { headers: {} } as never,
        {} as never,
        async () => [],
        async () => null,
      ),
    { message: "É necessário estar autenticado para acessar o quiz." },
  );
});
