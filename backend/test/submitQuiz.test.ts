import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { submitQuizController } from "../src/modules/quiz/controllers/submitQuiz.controller";

const ANALYSIS = {
  areaPrincipal: "Desenvolvimento Web",
  areasSecundarias: ["Dados"],
  justificativa: "Perfil com afinidade por interfaces.",
  tecnologiasSugeridas: ["React", "Node.js"],
};

const BODY = { answers: { "q-1": "Gosto de construir telas" } };

function replyStub() {
  const send = mock.fn((payload: unknown) => payload);
  return { reply: { send } as never, send };
}

// Regressão: o diagnóstico precisa ser gravado no mesmo usuário que
// getQuizDiagnosis consulta. Quando isso divergia, a intro do quiz reabria
// a cada login para quem já tinha respondido.
test("controller saves the diagnosis for the session user outside production", async () => {
  const { reply, send } = replyStub();
  const saveDiagnosis = mock.fn(async () => {});
  const analyzeQuiz = mock.fn(async () => ANALYSIS);

  await submitQuizController(
    { headers: { authorization: "Bearer token" }, body: BODY } as never,
    reply,
    {
      analyzeQuiz,
      saveDiagnosis,
      getSession: async () => ({ user: { id: "user-1" } }),
      resolveDevelopmentUser: async () => {
        throw new Error("must not fall back while a session exists");
      },
      isProduction: () => false,
    },
  );

  assert.equal(analyzeQuiz.mock.calls[0]?.arguments[1], "user-1");
  assert.equal(saveDiagnosis.mock.calls[0]?.arguments[0], "user-1");
  assert.deepEqual(saveDiagnosis.mock.calls[0]?.arguments[1], ANALYSIS);
  assert.deepEqual(send.mock.calls[0]?.arguments[0], ANALYSIS);
});

test("controller forwards the Authorization header to the session resolver", async () => {
  const { reply } = replyStub();
  const getSession = mock.fn(async ({ headers }: { headers: Headers }) => {
    assert.equal(headers.get("authorization"), "Bearer token-123");
    return { user: { id: "user-1" } };
  });

  await submitQuizController(
    { headers: { authorization: "Bearer token-123" }, body: BODY } as never,
    reply,
    {
      getSession,
      analyzeQuiz: async () => ANALYSIS,
      saveDiagnosis: async () => {},
      isProduction: () => false,
    },
  );

  assert.equal(getSession.mock.callCount(), 1);
});

test("controller falls back to the development user outside production", async () => {
  const { reply } = replyStub();
  const saveDiagnosis = mock.fn(async () => {});

  await submitQuizController({ headers: {}, body: BODY } as never, reply, {
    saveDiagnosis,
    analyzeQuiz: async () => ANALYSIS,
    getSession: async () => null,
    resolveDevelopmentUser: async () => "development-user",
    isProduction: () => false,
  });

  assert.equal(saveDiagnosis.mock.calls[0]?.arguments[0], "development-user");
});

test("controller rejects unauthenticated requests in production", async () => {
  const { reply } = replyStub();

  await assert.rejects(
    () =>
      submitQuizController({ headers: {}, body: BODY } as never, reply, {
        getSession: async () => null,
        isProduction: () => true,
        analyzeQuiz: async () => {
          throw new Error("must not be called");
        },
        saveDiagnosis: async () => {
          throw new Error("must not be called");
        },
      }),
    { message: "É necessário estar autenticado para enviar o quiz." },
  );
});

test("controller rejects a payload without answers", async () => {
  const { reply } = replyStub();

  await assert.rejects(
    () =>
      submitQuizController({ headers: {}, body: {} } as never, reply, {
        getSession: async () => ({ user: { id: "user-1" } }),
        isProduction: () => false,
        analyzeQuiz: async () => {
          throw new Error("must not be called");
        },
        saveDiagnosis: async () => {
          throw new Error("must not be called");
        },
      }),
    { message: "As respostas do quiz são obrigatórias." },
  );
});
