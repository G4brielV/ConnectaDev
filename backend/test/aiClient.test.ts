import { expect, test, vi } from "vitest";
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
  const fetchImpl = vi.fn(async () => jsonResponse(chatReply('{"ok":true}')));

  const provider = createXaiProvider({
    apiKey: "chave-de-teste",
    model: "grok-build-0.1",
    fetchImpl: fetchImpl as never,
  });
  const result = await provider.generateJson(params);

  expect(result).toEqual({ ok: true });

  const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://api.x.ai/v1/chat/completions");
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer chave-de-teste");

  const body = JSON.parse(init.body as string);
  expect(body.model).toBe("grok-build-0.1");
  expect(body.response_format.type).toBe("json_schema");
  expect(body.response_format.json_schema.strict).toBe(true);
  expect(body.response_format.json_schema.name).toBe("probe");
  expect(body.response_format.json_schema.schema).toEqual(SCHEMA);
  expect(body.messages).toEqual([{ role: "user", content: "responda ok" }]);
  expect(body.max_tokens, "sem teto alto a resposta trunca e o schema falha").toBe(8000);
});

test("xai não tenta extrair JSON de texto solto: resposta inválida é erro", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () => jsonResponse(chatReply("desculpe, não consigo"))) as never,
  });

  await expect(provider.generateJson(params)).rejects.toThrow(AiMalformedResponseError);
});

test("xai trata resposta vazia como malformada", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () => jsonResponse({ choices: [] })) as never,
  });

  await expect(provider.generateJson(params)).rejects.toThrow(AiMalformedResponseError);
});

test("xai preserva o status e a mensagem do erro HTTP", async () => {
  const provider = createXaiProvider({
    apiKey: "k",
    fetchImpl: (async () =>
      jsonResponse({ error: "sem créditos nesta equipe" }, 403)) as never,
  });

  const request = provider.generateJson(params);
  await expect(request).rejects.toBeInstanceOf(AiRequestError);
  await expect(request).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/créditos/) });
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

  await expect(provider.generateJson(params)).rejects.toThrow(AiTimeoutError);
});

test("xai sem chave falha antes de chamar a rede", async () => {
  // apiKey undefined cai no fallback de ambiente por design, entao a
  // ausencia real de chave so aparece com a variavel tambem vazia.
  const previous = process.env.XAI_API_KEY;
  delete process.env.XAI_API_KEY;

  try {
    const fetchImpl = vi.fn(async () => jsonResponse({}));
    const provider = createXaiProvider({ fetchImpl: fetchImpl as never });

    await expect(provider.generateJson(params)).rejects.toThrow(AiNotConfiguredError);
    expect(fetchImpl.mock.calls.length, "nao deve gastar chamada sem chave").toBe(0);
  } finally {
    restoreEnv("XAI_API_KEY", previous);
  }
});

// ---------- Gemini (alternativa) ----------

test("gemini mantém o formato antigo de requisição", async () => {
  const fetchImpl = vi.fn(async () =>
    jsonResponse({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
  );

  const provider = createGeminiProvider({
    apiKey: "chave-gemini",
    model: "gemini-3.5-flash-lite",
    fetchImpl: fetchImpl as never,
  });
  const result = await provider.generateJson(params);

  expect(result).toEqual({ ok: true });

  const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
  expect(url).toMatch(/generativelanguage\.googleapis\.com/);
  expect((init.headers as Record<string, string>)["X-goog-api-key"]).toBe("chave-gemini");

  const body = JSON.parse(init.body as string);
  expect(body.contents[0].parts[0].text).toBe("responda ok");
  expect(body.generationConfig.responseMimeType).toBe("application/json");
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

  expect(await provider.generateJson(params)).toEqual({ ok: true });
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
  const groqFetch = vi.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  await generateJson(params, { fetchImpl: groqFetch as never });
  expect((groqFetch.mock.calls[0] as [string])[0], "sem AI_PROVIDER o padrão é groq").toMatch(/api\.groq\.com/);

  const xaiFetch = vi.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  await generateJson(params, { provider: "xai", fetchImpl: xaiFetch as never });
  expect((xaiFetch.mock.calls[0] as [string])[0]).toMatch(/api\.x\.ai/);

  const geminiFetch = vi.fn(async () =>
    jsonResponse({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
  );
  await generateJson(params, { provider: "gemini", fetchImpl: geminiFetch as never });
  expect((geminiFetch.mock.calls[0] as [string])[0]).toMatch(/generativelanguage/);
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

  const request = provider.generateJson(params);
  await expect(request).rejects.toBeInstanceOf(AiMalformedResponseError);
  await expect(request).rejects.toMatchObject({ message: expect.stringMatching(/cortada/) });
});

test("groq aponta para o endpoint compatível com OpenAI", async () => {
  const fetchImpl = vi.fn(async () => jsonResponse(chatReply('{"ok":true}')));
  const provider = createGroqProvider({
    apiKey: "chave-groq",
    model: "openai/gpt-oss-120b",
    fetchImpl: fetchImpl as never,
  });

  expect(await provider.generateJson(params)).toEqual({ ok: true });

  const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
  expect(JSON.parse(init.body as string).model).toBe("openai/gpt-oss-120b");
});
