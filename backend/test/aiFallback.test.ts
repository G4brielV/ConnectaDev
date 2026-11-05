import { afterEach, describe, expect, it, vi } from "vitest";

const validAnalysis = {
  areaPrincipal: "Desenvolvimento de Software",
  areasSecundarias: ["Dados e Inteligência Artificial"],
  justificativa: "A análise indica afinidade com construção de soluções digitais e prática de programação.",
  tecnologiasSugeridas: ["TypeScript", "APIs REST"],
};

describe("fallback de IA para Groq", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("usa Groq quando Gemini retorna indisponibilidade", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");

    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.groq.com/openai/v1/chat/completions",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer groq-test-key",
        }),
      }),
    );
  });
});
