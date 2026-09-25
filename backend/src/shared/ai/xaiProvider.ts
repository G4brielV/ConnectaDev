import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider";
import { AiProvider, FetchLike } from "./types";

const XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-build-0.1";

export interface XaiProviderOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
}

/** xAI (Grok). Requer créditos na conta — não tem tier gratuito. */
export function createXaiProvider(options: XaiProviderOptions = {}): AiProvider {
  return createOpenAiCompatibleProvider({
    name: "xai",
    endpoint: XAI_ENDPOINT,
    apiKey: options.apiKey ?? process.env.XAI_API_KEY,
    model: options.model ?? process.env.XAI_MODEL ?? DEFAULT_MODEL,
    fetchImpl: options.fetchImpl,
    defaultMaxTokens: 8000,
  });
}
