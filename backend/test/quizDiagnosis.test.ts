import assert from "node:assert/strict";
import test, { mock } from "node:test";
import fastify from "fastify";
import {
  QuizDiagnosisRepository,
  getQuizDiagnosisService,
} from "../src/modules/quiz/services/getQuizDiagnosis.service";
import { getQuizDiagnosisController } from "../src/modules/quiz/controllers/getQuizDiagnosis.controller";
import { errorHandler } from "../src/shared/middlewares/errorHandler";

// ---------- Serviço ----------

test("getQuizDiagnosisService reports not completed when there is no diagnosis", async () => {
  const repository: QuizDiagnosisRepository = {
    findDiagnosis: async () => null,
  };

  const status = await getQuizDiagnosisService("user-1", repository);

  assert.deepEqual(status, {
    completed: false,
    areaPrincipal: null,
    tecnologiasSugeridas: [],
  });
});

test("getQuizDiagnosisService maps the stored diagnosis and keeps only string technologies", async () => {
  const repository: QuizDiagnosisRepository = {
    findDiagnosis: async (userId) => {
      assert.equal(userId, "user-1");
      return {
        areaPrincipal: "Desenvolvimento Web",
        tecnologiasSugeridas: ["React", 42, "Node.js", null],
      };
    },
  };

  const status = await getQuizDiagnosisService("user-1", repository);

  assert.deepEqual(status, {
    completed: true,
    areaPrincipal: "Desenvolvimento Web",
    tecnologiasSugeridas: ["React", "Node.js"],
  });
});

test("getQuizDiagnosisService treats a non-array technologies payload as empty", async () => {
  const status = await getQuizDiagnosisService("user-1", {
    findDiagnosis: async () => ({ areaPrincipal: "Dados", tecnologiasSugeridas: "SQL" }),
  });

  assert.deepEqual(status.tecnologiasSugeridas, []);
  assert.equal(status.completed, true);
});

// ---------- Controller ----------

test("controller answers 200 with the diagnosis of the session user", async () => {
  const send = mock.fn((payload: unknown) => payload);
  const status = mock.fn(() => ({ send }));
  const loadDiagnosis = mock.fn(async (userId: string) => ({
    completed: true,
    areaPrincipal: userId === "user-1" ? "Dados" : "outro",
    tecnologiasSugeridas: ["SQL"],
  }));

  await getQuizDiagnosisController(
    { headers: { authorization: "Bearer token" } } as never,
    { status } as never,
    {
      loadDiagnosis,
      getSession: async () => ({ user: { id: "user-1" } }),
      isProduction: () => true,
    },
  );

  assert.equal(loadDiagnosis.mock.calls[0]?.arguments[0], "user-1");
  assert.equal(status.mock.calls[0]?.arguments[0], 200);
  assert.deepEqual(send.mock.calls[0]?.arguments[0], {
    completed: true,
    areaPrincipal: "Dados",
    tecnologiasSugeridas: ["SQL"],
  });
});

test("controller rejects unauthenticated requests in production", async () => {
  await assert.rejects(
    () =>
      getQuizDiagnosisController({ headers: {} } as never, {} as never, {
        loadDiagnosis: async () => {
          throw new Error("must not be called");
        },
        getSession: async () => null,
        isProduction: () => true,
      }),
    { message: "É necessário estar autenticado para consultar o diagnóstico." },
  );
});

test("controller falls back to the development user outside production", async () => {
  const send = mock.fn((payload: unknown) => payload);
  const status = mock.fn(() => ({ send }));
  const loadDiagnosis = mock.fn(async () => ({
    completed: false,
    areaPrincipal: null,
    tecnologiasSugeridas: [],
  }));

  await getQuizDiagnosisController({ headers: {} } as never, { status } as never, {
    loadDiagnosis,
    getSession: async () => null,
    resolveDevelopmentUser: async () => "development-user",
    isProduction: () => false,
  });

  assert.equal(loadDiagnosis.mock.calls[0]?.arguments[0], "development-user");
  assert.equal(status.mock.calls[0]?.arguments[0], 200);
});

test("controller forwards the Authorization header to the session resolver", async () => {
  const seenHeaders: string[] = [];

  await getQuizDiagnosisController(
    { headers: { authorization: "Bearer abc", accept: ["a", "b"] } } as never,
    { status: () => ({ send: () => undefined }) } as never,
    {
      loadDiagnosis: async () => ({ completed: false, areaPrincipal: null, tecnologiasSugeridas: [] }),
      getSession: async ({ headers }) => {
        seenHeaders.push(headers.get("authorization") ?? "", headers.get("accept") ?? "");
        return { user: { id: "user-1" } };
      },
    },
  );

  assert.deepEqual(seenHeaders, ["Bearer abc", "a,b"]);
});

// ---------- Integração HTTP (rota + errorHandler, sem banco) ----------

function buildApp(session: { user: { id: string } } | null, completed: boolean) {
  const app = fastify();
  app.setErrorHandler(errorHandler);
  app.get("/api/quiz/diagnosis", (request, reply) =>
    getQuizDiagnosisController(request, reply, {
      getSession: async () => session,
      isProduction: () => true,
      loadDiagnosis: async (userId) => ({
        completed,
        areaPrincipal: completed ? `area-de-${userId}` : null,
        tecnologiasSugeridas: completed ? ["React"] : [],
      }),
    }),
  );
  return app;
}

test("GET /api/quiz/diagnosis returns the JSON status for an authenticated user", async () => {
  const app = buildApp({ user: { id: "user-1" } }, true);

  const response = await app.inject({
    method: "GET",
    url: "/api/quiz/diagnosis",
    headers: { authorization: "Bearer token" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"]?.toString().includes("application/json"), true);
  assert.deepEqual(response.json(), {
    completed: true,
    areaPrincipal: "area-de-user-1",
    tecnologiasSugeridas: ["React"],
  });
  await app.close();
});

test("GET /api/quiz/diagnosis reports completed=false for a user without diagnosis", async () => {
  const app = buildApp({ user: { id: "user-2" } }, false);

  const response = await app.inject({ method: "GET", url: "/api/quiz/diagnosis" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    completed: false,
    areaPrincipal: null,
    tecnologiasSugeridas: [],
  });
  await app.close();
});

test("GET /api/quiz/diagnosis answers 401 through the error handler when unauthenticated", async () => {
  const app = buildApp(null, false);

  const response = await app.inject({ method: "GET", url: "/api/quiz/diagnosis" });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    statusCode: 401,
    error: "App Error",
    message: "É necessário estar autenticado para consultar o diagnóstico.",
  });
  await app.close();
});
