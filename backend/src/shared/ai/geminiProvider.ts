import {
  AiMalformedResponseError,
  AiNotConfiguredError,
  AiProvider,
  AiRequestError,
  AiTimeoutError,
  FetchLike,
  GenerateJsonParams,
} from "./types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
}

/**
 * Caminho anterior, mantido como alternativa via AI_PROVIDER=gemini.
 *
 * O Gemini não garante o formato da saída: a resposta às vezes vem embrulhada
 * em markdown ou truncada, por isso o JSON ainda é extraído por regex e o
 * `jsonSchema` só entra no prompt como instrução, não como contrato.
 */
export function createGeminiProvider(options: GeminiProviderOptions = {}): AiProvider {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const doFetch = options.fetchImpl ?? fetch;

  return {
    name: "gemini",
    async generateJson(params: GenerateJsonParams): Promise<unknown> {
      if (!apiKey) throw new AiNotConfiguredError("gemini");

      const controller = new AbortController();
      const startedAt = Date.now();
      const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

      let response: Response;
      try {
        response = await doFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: params.prompt }] }],
              generationConfig: {
                temperature: params.temperature ?? 0.3,
                responseMimeType: "application/json",
                ...(params.maxTokens ? { maxOutputTokens: params.maxTokens } : {}),
              },
            }),
            signal: controller.signal,
          },
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new AiTimeoutError(Date.now() - startedAt);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new AiRequestError(
          response.status,
          body?.error?.message ?? `A IA recusou a solicitação (HTTP ${response.status}).`,
        );
      }

      const payload = (await response.json().catch(() => null)) as GeminiResponse | null;
      const rawText = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!rawText) {
        throw new AiMalformedResponseError("A IA devolveu uma resposta vazia.");
      }

      // Sem garantia de formato: tenta o texto inteiro e depois o maior bloco {...}
      try {
        return JSON.parse(rawText);
      } catch {
        const extracted = rawText.match(/\{[\s\S]*\}/)?.[0];
        if (!extracted) throw new AiMalformedResponseError();
        try {
          return JSON.parse(extracted);
        } catch {
          throw new AiMalformedResponseError();
        }
      }
    },
  };
}
