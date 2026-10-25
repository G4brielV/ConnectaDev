import { createGeminiProvider } from "./geminiProvider";
import { createXaiProvider } from "./xaiProvider";
import { createGroqProvider } from "./groqProvider";
import {
  AiNotConfiguredError,
  AiProvider,
  AiRequestError,
  AiTimeoutError,
  FetchLike,
  GenerateJsonParams,
} from "./types";

export * from "./types";

export type AiProviderName = "groq" | "xai" | "gemini";

export interface AiClientOptions {
  provider?: AiProviderName;
  fallbackProvider?: AiProviderName | null;
  fetchImpl?: FetchLike;
}

function resolveProviderName(explicit?: AiProviderName): AiProviderName {
  if (explicit) return explicit;
  const configured = process.env.AI_PROVIDER;
  if (configured === "gemini" || configured === "xai") return configured;
  return "groq";
}

export function createAiProvider(options: AiClientOptions = {}): AiProvider {
  const name = resolveProviderName(options.provider);
  if (name === "gemini") return createGeminiProvider({ fetchImpl: options.fetchImpl });
  if (name === "xai") return createXaiProvider({ fetchImpl: options.fetchImpl });
  return createGroqProvider({ fetchImpl: options.fetchImpl });
}

/**
 * Porta única de IA do projeto: recebe o prompt e o formato esperado,
 * devolve o JSON já parseado. Quem chama continua validando com Zod.
 *
 * Utiliza o Groq como provedor principal e o Gemini como fallback automático
 * em caso de falha de requisição (HTTP 5xx, 429), timeout ou chave não configurada.
 */
export async function generateJson(
  params: GenerateJsonParams,
  options: AiClientOptions = {},
): Promise<unknown> {
  const primaryName = resolveProviderName(options.provider);
  const fallbackName =
    options.fallbackProvider !== undefined
      ? options.fallbackProvider
      : primaryName === "groq"
      ? "gemini"
      : null;

  try {
    return await createAiProvider({ provider: primaryName, fetchImpl: options.fetchImpl }).generateJson(params);
  } catch (error) {
    if (
      fallbackName &&
      fallbackName !== primaryName &&
      (error instanceof AiNotConfiguredError ||
        error instanceof AiRequestError ||
        error instanceof AiTimeoutError)
    ) {
      console.warn(
        `[aiClient] Provedor primário '${primaryName}' falhou (${error instanceof Error ? error.message : String(error)}). Acionando fallback para '${fallbackName}'.`,
      );
      return await createAiProvider({ provider: fallbackName, fetchImpl: options.fetchImpl }).generateJson(params);
    }

    throw error;
  }
}
