/** Contrato único de IA do projeto. Os serviços não conhecem o provedor. */

export class AiTimeoutError extends Error {
  readonly durationMs: number;

  constructor(durationMs: number) {
    super("A IA demorou demais para responder.");
    this.name = "AiTimeoutError";
    this.durationMs = durationMs;
  }
}

export class AiRequestError extends Error {
  readonly status: number;
  /** Quando o provedor diz em quanto tempo tentar de novo (429). */
  readonly retryAfterMs: number | null;

  constructor(status: number, message: string, retryAfterMs: number | null = null) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export class AiMalformedResponseError extends Error {
  constructor(message = "A IA devolveu uma resposta fora do formato esperado.") {
    super(message);
    this.name = "AiMalformedResponseError";
  }
}

export class AiNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`A integração com a IA (${provider}) não está configurada.`);
    this.name = "AiNotConfiguredError";
  }
}

/** JSON Schema simplificado — só o que os provedores precisam receber. */
export type JsonSchema = Record<string, unknown>;

export interface GenerateJsonParams {
  /** Instrução completa, já montada pelo serviço chamador. */
  prompt: string;
  /** Nome do schema, exigido pelo structured output da xAI. */
  schemaName: string;
  jsonSchema: JsonSchema;
  timeoutMs: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  generateJson(params: GenerateJsonParams): Promise<unknown>;
}

/** Injetável para testar sem rede. */
export type FetchLike = typeof fetch;
