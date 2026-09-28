import { createGeminiProvider } from "./geminiProvider";
import { createXaiProvider } from "./xaiProvider";
import { createGroqProvider } from "./groqProvider";
import { AiProvider, FetchLike, GenerateJsonParams } from "./types";

export * from "./types";

export type AiProviderName = "groq" | "xai" | "gemini";

export interface AiClientOptions {
  provider?: AiProviderName;
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
 */
export async function generateJson(
  params: GenerateJsonParams,
  options: AiClientOptions = {},
): Promise<unknown> {
  return createAiProvider(options).generateJson(params);
}
