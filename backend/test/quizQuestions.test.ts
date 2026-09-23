import { describe, it, expect, vi } from "vitest";
import { getQuizQuestionsController } from "../src/modules/quiz/controllers/getQuizQuestions.controller";
import { getQuizQuestions } from "../src/modules/quiz/services/getQuizQuestions.service";

describe("getQuizQuestions (service)", () => {
  it("consulta apenas questões ativas em ordem crescente de sequência", async () => {
    const repository = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "question-1",
          statement: "Choose one",
          type: "MULTIPLE_CHOICE",
          sequence: 1,
          isActive: true,
          options: [{ id: "option-1", label: "Option" }],
          validation: null,
        },
      ]),
    };

    const questions = await getQuizQuestions(repository);

    expect(repository.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sequence: "asc" },
      select: {
        id: true,
        statement: true,
        type: true,
        sequence: true,
        isActive: true,
        options: true,
        validation: true,
      },
    });
    expect(questions[0]?.type).toBe("MULTIPLE_CHOICE");
  });

  it("retorna array vazio quando não há questões ativas", async () => {
    const repository = { findMany: vi.fn().mockResolvedValue([]) };

    await expect(getQuizQuestions(repository)).resolves.toEqual([]);
  });
});

describe("getQuizQuestionsController", () => {
  it("retorna HTTP 200 com array em requisição autenticada", async () => {
    const send = vi.fn((payload: unknown) => payload);
    const status = vi.fn(() => ({ send }));

    await getQuizQuestionsController(
      { headers: { authorization: "Bearer token" } } as never,
      { status } as never,
      async () => [],
      async () => ({ user: { id: "user-1" } }) as never,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith([]);
  });

  it("rejeita requisições não autenticadas", async () => {
    await expect(
      getQuizQuestionsController(
        { headers: {} } as never,
        {} as never,
        async () => [],
        async () => null,
      ),
    ).rejects.toThrow("É necessário estar autenticado para acessar o quiz.");
  });
});