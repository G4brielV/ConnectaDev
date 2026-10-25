import { afterEach, describe, expect, it, vi } from "vitest";

const validAnalysis = {
  areaPrincipal: "Desenvolvimento de Software",
  areasSecundarias: ["Dados e Inteligência Artificial"],
  justificativa: "A análise indica afinidade com construção de soluções digitais e prática de programação.",
  tecnologiasSugeridas: ["TypeScript", "APIs REST"],
};

describe("fallback de IA: Groq como principal e Gemini como fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("usa Gemini como fallback quando Groq retorna indisponibilidade (HTTP 503)", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");

    const fetchMock = vi.fn<typeof fetch>()
      // 1ª chamada (Groq): retorna 503
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      // 2ª chamada (Gemini - fallback): retorna 200 com candidates
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(validAnalysis) }],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { submitQuiz } = await import(
      "../src/modules/quiz/services/submitQuiz.service"
    );
    const result = await submitQuiz(
      { answers: { "question-1": "Gosto de criar sistemas." } },
      "user-1",
    );

    expect(result).toEqual(validAnalysis);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 1ª chamada deve ser para a API do Groq
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.groq.com/openai/v1/chat/completions",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer groq-test-key",
        }),
      }),
    );

    // 2ª chamada deve ser para a API do Gemini (fallback)
    expect(fetchMock.mock.calls[1]?.[0]).toMatch(/generativelanguage\.googleapis\.com/);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-goog-api-key": "gemini-test-key",
        }),
      }),
    );
  });

  it("usa Groq com sucesso direto sem chamar Gemini quando Groq responde 200", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");

    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(validAnalysis) } }],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { submitQuiz } = await import(
      "../src/modules/quiz/services/submitQuiz.service"
    );
    const result = await submitQuiz(
      { answers: { "question-1": "Gosto de criar sistemas." } },
      "user-1",
    );

    expect(result).toEqual(validAnalysis);
    // Apenas 1 requisição feita — Gemini não é acionado
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.groq.com/openai/v1/chat/completions",
    );
  });

  it("usa Gemini como fallback transparente quando GROQ_API_KEY não está configurada", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    delete process.env.GROQ_API_KEY;

    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(validAnalysis) }],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { submitQuiz } = await import(
      "../src/modules/quiz/services/submitQuiz.service"
    );
    const result = await submitQuiz(
      { answers: { "question-1": "Gosto de criar sistemas." } },
      "user-1",
    );

    expect(result).toEqual(validAnalysis);
    // Como a chave da Groq não existe, a chamada para a Groq é abortada localmente e cai direto no Gemini
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/generativelanguage\.googleapis\.com/);
  });

  it("propaga erro quando ambos Groq e Gemini falham", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");

    const fetchMock = vi.fn<typeof fetch>()
      // Groq falha com 503
      .mockResolvedValueOnce(new Response("groq unavailable", { status: 503 }))
      // Gemini falha com 503
      .mockResolvedValueOnce(new Response("gemini unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const { submitQuiz } = await import(
      "../src/modules/quiz/services/submitQuiz.service"
    );

    await expect(
      submitQuiz(
        { answers: { "question-1": "Gosto de criar sistemas." } },
        "user-1",
      ),
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
