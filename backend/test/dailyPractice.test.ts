import { describe, expect, it, vi } from "vitest";

// O teto de complementos vive em getTrailPhase.service, que fala com o banco
// e com a IA; os dois são trocados por dublês aqui.
const m = vi.hoisted(() => ({
  findMany: vi.fn(),
  createMany: vi.fn(),
  generate: vi.fn(),
}));

vi.mock("../src/lib/auth", () => ({
  prisma: { trailQuestion: { findMany: m.findMany, createMany: m.createMany } },
}));

vi.mock("../src/modules/reviews/services/generateReviewQuestions.service", () => ({
  AiQuestionGenerationError: class extends Error {},
  generateQuestionsForPhase: m.generate,
}));

import {
  ensurePhaseQuestions,
  MAX_BACKGROUND_TOP_UPS,
} from "../src/modules/gamification/services/getTrailPhase.service";
import {
  composePractice,
  hasPracticeSources,
  PRACTICE_CURRENT_SHARE,
  PRACTICE_MAX_XP,
  PRACTICE_SIZE,
  practiceSources,
  practiceXp,
} from "../src/modules/gamification/services/practiceRules";

/** Gerador determinístico (LCG) para os sorteios serem reproduzíveis. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const OPTIONS = [
  { id: "A", label: "a" },
  { id: "B", label: "b" },
  { id: "C", label: "c" },
  { id: "D", label: "d" },
];

function pool(prefix: string, size: number) {
  return Array.from({ length: size }, (_, index) => ({
    id: `${prefix}${index + 1}`,
    options: OPTIONS,
  }));
}

describe("fontes da prática", () => {
  it("usa a fase atual e as concluídas, nunca as travadas", () => {
    const sources = practiceSources([
      { id: "f1", status: "completed" },
      { id: "bau", status: "available" },
      { id: "f2", status: "completed" },
      { id: "f3", status: "current" },
      { id: "f4", status: "locked" },
    ]);

    expect(sources).toEqual({ currentId: "f3", reviewIds: ["f1", "f2"] });
    expect(hasPracticeSources(sources)).toBe(true);
  });

  it("sem fase atual nem concluída não há o que praticar", () => {
    const sources = practiceSources([{ id: "f1", status: "locked" }]);
    expect(hasPracticeSources(sources)).toBe(false);
  });
});

describe("composição da prática", () => {
  it("3 perguntas da fase atual e 2 de revisão", () => {
    const picks = composePractice(pool("c", 40), pool("r", 40), new Map(), seededRandom(1));

    expect(picks).toHaveLength(PRACTICE_SIZE);
    expect(picks.filter((pick) => !pick.isReview)).toHaveLength(PRACTICE_CURRENT_SHARE);
    expect(picks.filter((pick) => pick.isReview).every((pick) => pick.question.id.startsWith("r"))).toBe(true);
  });

  it("sem fase concluída, as 5 saem da fase atual", () => {
    const picks = composePractice(pool("c", 40), [], new Map(), seededRandom(2));

    expect(picks).toHaveLength(PRACTICE_SIZE);
    expect(picks.every((pick) => !pick.isReview)).toBe(true);
  });

  it("trilha terminada: as 5 saem da revisão", () => {
    const picks = composePractice([], pool("r", 40), new Map(), seededRandom(3));

    expect(picks).toHaveLength(PRACTICE_SIZE);
    expect(picks.every((pick) => pick.isReview)).toBe(true);
  });

  it("revisão curta é completada pela fase atual, e banco curto não inventa pergunta", () => {
    const withShortReview = composePractice(pool("c", 40), pool("r", 1), new Map(), seededRandom(4));
    expect(withShortReview).toHaveLength(PRACTICE_SIZE);
    expect(withShortReview.filter((pick) => pick.isReview)).toHaveLength(1);

    const tiny = composePractice(pool("c", 2), [], new Map(), seededRandom(5));
    expect(tiny).toHaveLength(2);
  });

  it("não repete pergunta e embaralha as alternativas mantendo os ids", () => {
    const picks = composePractice(pool("c", 40), pool("r", 40), new Map(), seededRandom(6));
    const ids = picks.map((pick) => pick.question.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const pick of picks) {
      expect(pick.question.options.map((option) => option.id).sort()).toEqual(["A", "B", "C", "D"]);
    }
    expect(picks.some((pick) => pick.question.options[0].id !== "A")).toBe(true);
  });

  it("prioriza as nunca vistas, depois as erradas, por último as acertadas", () => {
    const current = pool("c", 6);
    // c1 e c2 acertadas, c3 errada; c4, c5 e c6 nunca vistas.
    const history = new Map([
      ["c1", true],
      ["c2", true],
      ["c3", false],
    ]);

    const picks = composePractice(current, [], history, seededRandom(7));
    const ids = new Set(picks.map((pick) => pick.question.id));

    expect(ids.size).toBe(PRACTICE_SIZE);
    for (const id of ["c3", "c4", "c5", "c6"]) expect(ids.has(id)).toBe(true);
    // Só sobra vaga para uma das acertadas.
    expect(ids.has("c1") !== ids.has("c2")).toBe(true);
  });
});

describe("XP da prática", () => {
  it("a primeira do dia paga 2 XP por acerto; as outras são treino", () => {
    expect(practiceXp(4, true)).toBe(8);
    expect(practiceXp(PRACTICE_SIZE, true)).toBe(PRACTICE_MAX_XP);
    expect(practiceXp(5, false)).toBe(0);
  });
});

describe("complemento do banco em segundo plano", () => {
  it(`no máximo ${MAX_BACKGROUND_TOP_UPS} geração por vez; quem chega com a fila cheia pula`, async () => {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      id: `q${index}`,
      statement: `Pergunta ${index}`,
      sequence: index + 1,
      options: OPTIONS,
    }));
    m.findMany.mockResolvedValue(questions);
    m.createMany.mockResolvedValue({ count: 0 });

    let finishGeneration: (value: never[]) => void = () => undefined;
    m.generate.mockImplementationOnce(
      () => new Promise((resolve) => {
        finishGeneration = resolve;
      }),
    );
    m.generate.mockResolvedValue([]);

    const context = {
      title: "Fase",
      description: null,
      unitTitle: "Unidade",
      area: "Desenvolvimento de Software",
      resourceTitles: [],
      kind: "STANDARD",
      unitPhaseTitles: ["Fase"],
    };

    // Banco com 10 (dá uma prova, mas não chega a 40): pede complemento sem bloquear.
    await expect(ensurePhaseQuestions("fase-a", context)).resolves.toHaveLength(10);
    expect(m.generate).toHaveBeenCalledTimes(1);

    // Outra fase enquanto a primeira gera: não dispara uma segunda chamada.
    await ensurePhaseQuestions("fase-b", context);
    expect(m.generate).toHaveBeenCalledTimes(1);

    // Terminada a primeira, a próxima visita volta a completar.
    finishGeneration([]);
    await vi.waitFor(async () => {
      await ensurePhaseQuestions("fase-b", context);
      expect(m.generate).toHaveBeenCalledTimes(2);
    });
  });
});
