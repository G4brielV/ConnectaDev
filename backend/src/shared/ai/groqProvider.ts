import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider";
import { AiProvider, FetchLike } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export interface GroqProviderOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
}

/**
 * Groq: inferência rápida de modelos abertos, com tier gratuito.
 * Medimos ~4s para gerar uma prova de 10 questões, contra 8-91s do Gemini.
 */
export function createGroqProvider(options: GroqProviderOptions = {}): AiProvider {
  return createOpenAiCompatibleProvider({
    name: "groq",
    endpoint: GROQ_ENDPOINT,
    apiKey: options.apiKey ?? process.env.GROQ_API_KEY,
    model: options.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL,
    fetchImpl: options.fetchImpl,
    // O tier gratuito conta max_tokens no orçamento de TPM (8000), entao
    // reservar demais faz a propria chamada estourar o limite. Uma prova de
    // 10 questoes usa ~1800 tokens de saida; 4000 da folga sem desperdicio.
    defaultMaxTokens: 4000,
  });
}
