import { expect, test, vi } from "vitest";
import { submitQuizController } from "../src/modules/quiz/controllers/submitQuiz.controller";
import {
  saveQuizDiagnosis,
  SaveQuizDiagnosisTx,
} from "../src/modules/quiz/services/saveQuizDiagnosis.service";

const ANALYSIS = {
  areaPrincipal: "Desenvolvimento Web",
  areasSecundarias: ["Dados"],
  justificativa: "Perfil com afinidade por interfaces.",
  tecnologiasSugeridas: ["React", "Node.js"],
};

const BODY = { answers: { "q-1": "Gosto de construir telas" } };

function replyStub() {
  const send = vi.fn((payload: unknown) => payload);
  return { reply: { send } as never, send };
}

// Regressão: o diagnóstico precisa ser gravado no mesmo usuário que
// getQuizDiagnosis consulta. Quando isso divergia, a intro do quiz reabria
// a cada login para quem já tinha respondido.
test("controller saves the diagnosis for the session user outside production", async () => {
  const { reply, send } = replyStub();
  const saveDiagnosis = vi.fn(async () => {});
  const analyzeQuiz = vi.fn(async () => ANALYSIS);

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

  expect(analyzeQuiz.mock.calls[0][1]).toBe("user-1");
  expect(saveDiagnosis.mock.calls[0][0]).toBe("user-1");
  expect(saveDiagnosis.mock.calls[0][1]).toEqual(ANALYSIS);
  expect(send.mock.calls[0][0]).toEqual(ANALYSIS);
});

test("controller forwards the Authorization header to the session resolver", async () => {
  const { reply } = replyStub();
  const getSession = vi.fn(async ({ headers }: { headers: Headers }) => {
    expect(headers.get("authorization")).toBe("Bearer token-123");
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

  expect(getSession.mock.calls.length).toBe(1);
});

test("controller falls back to the development user outside production", async () => {
  const { reply } = replyStub();
  const saveDiagnosis = vi.fn(async () => {});

  await submitQuizController({ headers: {}, body: BODY } as never, reply, {
    saveDiagnosis,
    analyzeQuiz: async () => ANALYSIS,
    getSession: async () => null,
    resolveDevelopmentUser: async () => "development-user",
    isProduction: () => false,
  });

  expect(saveDiagnosis.mock.calls[0][0]).toBe("development-user");
});

test("controller rejects unauthenticated requests in production", async () => {
  const { reply } = replyStub();

  await expect(
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
  ).rejects.toMatchObject({ message: "É necessário estar autenticado para enviar o quiz." });
});

test("controller rejects a payload without answers", async () => {
  const { reply } = replyStub();

  await expect(
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
  ).rejects.toMatchObject({ message: "As respostas do quiz são obrigatórias." });
});

test("saveQuizDiagnosis persists diagnosis and resets trail progress while preserving xpAwarded", async () => {
  const upsert = vi.fn(async () => ({}));
  const updateMany = vi.fn(async () => ({ count: 3 }));
  const tx: SaveQuizDiagnosisTx = {
    vocationalDiagnosis: { upsert },
    userTrailProgress: { updateMany },
  };
  const runInTransaction = vi.fn(async <T>(cb: (client: SaveQuizDiagnosisTx) => Promise<T>) =>
    cb(tx),
  );

  await saveQuizDiagnosis(
    "user-42",
    {
      areaPrincipal: "Desenvolvimento de Software",
      areasSecundarias: ["Dados e Inteligência Artificial"],
      justificativa: "Perfil com afinidade por construir sistemas e resolver problemas lógicos.",
      tecnologiasSugeridas: ["TypeScript", "React"],
    },
    runInTransaction,
  );

  expect(runInTransaction).toHaveBeenCalledTimes(1);
  expect(upsert).toHaveBeenCalledWith({
    where: { userId: "user-42" },
    create: {
      userId: "user-42",
      areaPrincipal: "Desenvolvimento de Software",
      areasSecundarias: ["Dados e Inteligência Artificial"],
      tecnologiasSugeridas: ["TypeScript", "React"],
    },
    update: {
      areaPrincipal: "Desenvolvimento de Software",
      areasSecundarias: ["Dados e Inteligência Artificial"],
      tecnologiasSugeridas: ["TypeScript", "React"],
    },
  });
  expect(updateMany).toHaveBeenCalledWith({
    where: { userId: "user-42" },
    data: {
      passed: false,
      stars: 0,
      bestCorrect: 0,
      bestPercentage: 0,
      attempts: 0,
      totalQuestions: 0,
      completedAt: null,
    },
  });
  expect(updateMany.mock.calls[0]?.[0].data).not.toHaveProperty("xpAwarded");
});
