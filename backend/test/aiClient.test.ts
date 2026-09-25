import assert from "node:assert/strict";
import test, { mock } from "node:test";
import {
  AiMalformedResponseError,
  AiNotConfiguredError,
  AiRequestError,
  AiTimeoutError,
  generateJson,
} from "../src/shared/ai/aiClient";
import { createXaiProvider } from "../src/shared/ai/xaiProvider";
import { createGroqProvider } from "../src/shared/ai/groqProvider";
import { createGeminiProvider } from "../src/shared/ai/geminiProvider";

const SCHEMA = {
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
  additionalProperties: false,
};

const params = {
  prompt: "responda ok",
  schemaName: "probe",
  jsonSchema: SCHEMA,
  timeoutMs: 5000,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function chatReply(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

// ---------- xAI ----------

test("xai envia structured output strict e Bearer token", async () => {
  const fetchImpl = mock.fn(async () => jsonResponse(chatReply('{"ok":true}')));

  const provider = createXaiProvider({
    apiKey: "chave-de-teste",
    model: "grok-build-0.1",
    fetchImpl: fetchImpl as never,
  });
  const result = await provider.generateJson(params);

  assert.deepEqual(result, { ok: true });

  const [url, init] = fetchImpl.mock.calls[0]?.arguments as [string, RequestInit];
  assert.equal(url, "https://api.x.ai/v1/chat/completions");
  assert.equal(
    (init.headers as Record<string, string>).Authorization,
    "Bearer chave-de-teste",
  );

  const body = JSON.parse(init.body as string);
  assert.equal(body.model, "grok-build-0.1");
  assert.equal(body.response_format.type, "json_schema");
  assert.equal(body.response_format.json_schema.strict, true);
  assert.equal(body.response_format.json_schema.name, "probe");
  assert.deepEqual(body.response_format.json_schema.schema, SCHEMA);
  assert.deepEqual(body.messages, [{ role: "user", content: "responda ok" }]);
  assert.equal(body.max_tokens, 8000, "sem teto alto a resposta trunca e o schema falha");
});

test("xai não tenta extrair JSON de texto solto: resposta inválida é erro", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () => jsonResponse(chatReply("desculpe, não consigo"))) as never,
  });

  await assert.rejects(() => provider.generateJson(params), AiMalformedResponseError);
});

test("xai trata resposta vazia como malformada", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () => jsonResponse({ choices: [] })) as never,
  });

  await assert.rejects(() => provider.generateJson(params), AiMalformedResponseError);
});

test("xai preserva o status e a mensagem do erro HTTP", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () =>
      jsonResponse({ error: "sem créditos nesta equipe" }, 403)) as never,
  });

  await assert.rejects(
    () => provider.generateJson(params),
    (error: unknown) => {
      assert.ok(error instanceof AiRequestError);
      assert.equal(error.status, 403);
      assert.match(error.message, /créditos/);
      return true;
    },
  );
});

test("xai converte abort em AiTimeoutError", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    }) as never,
  });

  await assert.rejects(() => provider.generateJson(params), AiTimeoutError);
});

test("xai sem chave falha antes de chamar a rede", async () => {
  // apiKey undefined cai no fallback de ambiente por design, entao a
  // ausencia real de chave so aparece com a variavel tambem vazia.
  const previous = process.env.XAI_API_KEY;
  delete process.env.XAI_API_KEY;

  try {
    const fetchImpl = mock.fn(async () => jsonResponse({}));
    const provider = createXaiProvider({ fetchImpl: fetchImpl as never });

    await assert.rejects(() => provider.generateJson(params), AiNotConfiguredError);
    assert.equal(fetchImpl.mock.callCount(), 0, "nao deve gastar chamada sem chave");
  } finally {
    restoreEnv("XAI_API_KEY", previous);
  }
});

// ---------- Gemini (alternativa) ----------

test("gemini mantém o formato antigo de requisição", async () => {
  const fetchImpl = mock.fn(async () =>
    jsonResponse({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
  );

  const provider = createGeminiProvider({
    apiKey: "chave-gemini",
    model: "gemini-3.5-flash-lite",
    fetchImpl: fetchImpl as never,
  });
  const result = await provider.generateJson(params);

  assert.deepEqual(result, { ok: true });

  const [url, init] = fetchImpl.mock.calls[0]?.arguments as [string, RequestInit];
  assert.match(url, /generativelanguage\.googleapis\.com/);
  assert.equal((init.headers as Record<string, string>)["X-goog-api-key"], "chave-gemini");

  const body = JSON.parse(init.body as string);
  assert.equal(body.contents[0].parts[0].text, "responda ok");
  assert.equal(body.generationConfig.responseMimeType, "application/json");
});

test("gemini ainda resgata JSON embrulhado em markdown", async () => {
  const provider = createGeminiProvider({
    apiKey: "k",
    fetchImpl: (async () =>
      jsonResponse({
        candidates: [
          { content: { parts: [{ text: '```json\n{"ok":true}\n```' }] } },
        ],
      })) as never,
  });

  assert.deepEqual(await provider.generateJson(params), { ok: true });
});

// ---------- seleção de provedor ----------

test("AI_PROVIDER escolhe o provedor, com groq como padrão", async () => {
  // generateJson lê as chaves do ambiente, então o teste as define em vez de
  // depender do .env da máquina (e da ordem dos testes).
  const previous = {
    groq: process.env.GROQ_API_KEY,
    xai: process.env.XAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    provider: process.env.AI_PROVIDER,
  };
  process.env.GROQ_API_KEY = "chave-groq";
  process.env.XAI_API_KEY = "chave-xai";
  process.env.GEMINI_API_KEY = "chave-gemini";
  delete process.env.AI_PROVIDER;

  try {
    await runProviderSelection();
  } finally {
    restoreEnv("GROQ_API_KEY", previous.groq);
    restoreEnv("XAI_API_KEY", previous.xai);
    restoreEnv("GEMINI_API_KEY", previous.gemini);
    restoreEnv("AI_PROVIDER", previous.provider);
  }
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

async function runProviderSelection(): Promise<void> {
  const groqFetch = mock.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  await generateJson(params, { fetchImpl: groqFetch as never });
  assert.match(
    (groqFetch.mock.calls[0]?.arguments as [string])[0],
    /api\.groq\.com/,
    "sem AI_PROVIDER o padrão é groq",
  );

  const xaiFetch = mock.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  await generateJson(params, { provider: "xai", fetchImpl: xaiFetch as never });
  assert.match((xaiFetch.mock.calls[0]?.arguments as [string])[0], /api\.x\.ai/);

  const geminiFetch = mock.fn(async () =>
    jsonResponse({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
  );
  await generateJson(params, { provider: "gemini", fetchImpl: geminiFetch as never });
  assert.match(
    (geminiFetch.mock.calls[0]?.arguments as [string])[0],
    /generativelanguage/,
  );
}

test("resposta cortada por limite de tokens é tratada como malformada", async () => {
  // A Groq devolve finish_reason "length" quando estoura max_tokens; sem
  // detectar isso, o JSON truncado falharia com erro de parse genérico.
  const provider = createGroqProvider({
    apiKey: "k",
    fetchImpl: (async () =>
      jsonResponse({
        choices: [{ message: { content: '{"ok":' }, finish_reason: "length" }],
      })) as never,
  });

  await assert.rejects(
    () => provider.generateJson(params),
    (error: unknown) => {
      assert.ok(error instanceof AiMalformedResponseError);
      assert.match(error.message, /cortada/);
      return true;
    },
  );
});

test("groq aponta para o endpoint compatível com OpenAI", async () => {
  const fetchImpl = mock.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  const provider = createGroqProvider({
    apiKey: "chave-groq",
    model: "openai/gpt-oss-120b",
    fetchImpl: fetchImpl as never,
  });

  assert.deepEqual(await provider.generateJson(params), { ok: true });

  const [url, init] = fetchImpl.mock.calls[0]?.arguments as [string, RequestInit];
  assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(JSON.parse(init.body as string).model, "openai/gpt-oss-120b");
});
