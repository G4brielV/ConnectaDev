import {
  AiMalformedResponseError,
  AiNotConfiguredError,
  AiProvider,
  AiRequestError,
  AiTimeoutError,
  FetchLike,
  GenerateJsonParams,
} from "./types";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
}

export interface OpenAiCompatibleConfig {
  name: string;
  endpoint: string;
  apiKey: string | undefined;
  model: string;
  fetchImpl?: FetchLike;
  /**
   * Teto de tokens de saída quando o chamador não define um. Sem isso alguns
   * provedores truncam a resposta no meio e o structured output falha a
   * validação — foi o que aconteceu com a Groq gerando 10 questões.
   */
  defaultMaxTokens: number;
}

/**
 * Base dos provedores compatíveis com a API da OpenAI (Groq, xAI).
 *
 * Usa structured outputs com `strict: true`, então o corpo devolvido é
 * garantido conforme o JSON Schema: o parse é direto, sem precisar pescar
 * o JSON de dentro de texto ou de um bloco markdown.
 */
export function createOpenAiCompatibleProvider(
  config: OpenAiCompatibleConfig,
): AiProvider {
  const doFetch = config.fetchImpl ?? fetch;

  return {
    name: config.name,
    async generateJson(params: GenerateJsonParams): Promise<unknown> {
      if (!config.apiKey) throw new AiNotConfiguredError(config.name);

      const controller = new AbortController();
      const startedAt = Date.now();
      const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

      let response: Response;
      try {
        response = await doFetch(config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: "user", content: params.prompt }],
            temperature: params.temperature ?? 0.3,
            max_tokens: params.maxTokens ?? config.defaultMaxTokens,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: params.schemaName,
                schema: params.jsonSchema,
                strict: true,
              },
            },
          }),
          signal: controller.signal,
        });
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
          error?: string | { message?: string };
        } | null;
        const detail =
          typeof body?.error === "string" ? body.error : body?.error?.message;
        throw new AiRequestError(
          response.status,
          detail ?? `A IA recusou a solicitação (HTTP ${response.status}).`,
          parseRetryAfterMs(response, detail),
        );
      }

      const payload = (await response
        .json()
        .catch(() => null)) as ChatCompletionResponse | null;
      const choice = payload?.choices?.[0];
      const content = choice?.message?.content?.trim();

      if (!content) {
        throw new AiMalformedResponseError("A IA devolveu uma resposta vazia.");
      }

      if (choice?.finish_reason === "length") {
        throw new AiMalformedResponseError(
          "A resposta da IA foi cortada por limite de tokens.",
        );
      }

      try {
        return JSON.parse(content);
      } catch {
        throw new AiMalformedResponseError();
      }
    },
  };
}

/**
 * Quanto esperar antes de tentar de novo. O header `retry-after` vem em
 * segundos; a Groq também informa na mensagem ("try again in 644.99ms"),
 * que costuma ser bem mais preciso que um backoff fixo.
 */
function parseRetryAfterMs(response: Response, detail: string | undefined): number | null {
  const header = response.headers?.get?.("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.ceil(seconds * 1000);
  }

  const match = detail?.match(/try again in ([\d.]+)(ms|s)\b/i);
  if (match) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      return Math.ceil(match[2].toLowerCase() === "s" ? value * 1000 : value);
    }
  }

  return null;
}
