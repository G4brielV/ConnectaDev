import { describe, expect, it } from "vitest";
import { calculateVocationalResult } from "../src/modules/quiz/services/vocationalScoring.service";

describe("calculateVocationalResult", () => {
  it("pontua a área mapeada pela alternativa e não depende da ordem das opções", () => {
    const result = calculateVocationalResult(
      [
        {
          id: "q1",
          options: [
            { id: "A", targetArea: "Desenvolvimento de Software" },
            { id: "B", targetArea: "Cibersegurança" },
          ],
        },
        {
          id: "q2",
          options: [
            { id: "A", targetArea: "Cibersegurança" },
            { id: "B", targetArea: "Cibersegurança" },
          ],
        },
      ],
      { q1: "B", q2: "A" },
    );

    expect(result.primaryArea).toBe("Cibersegurança");
    expect(result.secondaryArea).toBe("Desenvolvimento de Software");
    expect(result.scores["Cibersegurança"]).toBe(2);
    expect(result.answeredQuestions).toBe(2);
  });

  it("ignora respostas sem targetArea válido", () => {
    const result = calculateVocationalResult(
      [{ id: "q1", options: [{ id: "A", label: "Resposta antiga" }] }],
      { q1: "A" },
    );

    expect(result.answeredQuestions).toBe(0);
    expect(result.primaryArea).toBe("Desenvolvimento de Software");
    expect(result.scores["Desenvolvimento de Software"]).toBe(0);
  });

  it("resolve empates pela primeira área escolhida, sem favorecer desenvolvimento", () => {
    const result = calculateVocationalResult(
      [
        {
          id: "q1",
          options: [{ id: "A", targetArea: "Design e Experiência do Usuário" }],
        },
        {
          id: "q2",
          options: [{ id: "A", targetArea: "Desenvolvimento de Software" }],
        },
      ],
      { q1: "A", q2: "A" },
    );

    expect(result.primaryArea).toBe("Design e Experiência do Usuário");
  });
});
