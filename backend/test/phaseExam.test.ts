import { expect, test } from "vitest";
import {
  drawExam,
  gradeFullLesson,
  gradePhaseExam,
  GradableQuestion,
  InvalidExamAnswersError,
  PHASE_EXAM_SIZE,
  shuffle,
} from "../src/modules/gamification/services/phaseExam";
import {
  pickExtraResources,
  youtubeThumbnail,
  ExtraCourseCandidate,
} from "../src/modules/gamification/services/phaseResources";

/** Gerador determinístico (LCG) para os sorteios serem reproduzíveis. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function question(index: number): GradableQuestion {
  return {
    id: `q${index}`,
    statement: `Pergunta ${index}`,
    options: [
      { id: "A", label: "a" },
      { id: "B", label: "b" },
      { id: "C", label: "c" },
      { id: "D", label: "d" },
    ],
    correctAnswer: "B",
    explanation: `Porque B na ${index}`,
  };
}

const pool = Array.from({ length: 20 }, (_, index) => question(index + 1));

test("shuffle mantém os mesmos itens e não mexe na entrada", () => {
  const input = [1, 2, 3, 4, 5];
  const output = shuffle(input, seededRandom(7));

  expect([...output].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(input).toEqual([1, 2, 3, 4, 5]);
});

test("a prova sorteia 10 perguntas distintas do banco, com as alternativas embaralhadas", () => {
  const exam = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(42));

  expect(exam.length).toBe(PHASE_EXAM_SIZE);
  expect(new Set(exam.map((q) => q.id)).size).toBe(PHASE_EXAM_SIZE);
  for (const drawn of exam) {
    expect(drawn.options.map((option) => option.id).sort(), "embaralhar não pode perder nem trocar o id das alternativas").toEqual(["A", "B", "C", "D"]);
  }
});

test("tentativas diferentes sorteiam provas diferentes", () => {
  const first = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(1)).map((q) => q.id);
  const second = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(2)).map((q) => q.id);
  expect(first).not.toEqual(second);
});

test("banco menor que a prova serve tudo o que tem", () => {
  expect(drawExam(pool.slice(0, 6), PHASE_EXAM_SIZE, seededRandom(3)).length).toBe(6);
});

test("a correção devolve acertos e o feedback de cada pergunta", () => {
  const answers: Record<string, string> = {};
  pool.slice(0, 10).forEach((q, index) => {
    answers[q.id] = index < 7 ? "B" : "A";
  });

  const grade = gradePhaseExam(pool, answers);

  expect(grade.correctCount).toBe(7);
  expect(grade.totalQuestions).toBe(10);
  const wrong = grade.review.find((item) => item.questionId === "q9");
  expect({
      selected: wrong?.selectedOptionId,
      correct: wrong?.correctOptionId,
      isCorrect: wrong?.isCorrect,
      explanation: wrong?.explanation,
    }).toEqual({ selected: "A", correct: "B", isCorrect: false, explanation: "Porque B na 9" });
});

test("não aceita prova incompleta — responder só as que sabe não passa", () => {
  expect(() => gradePhaseExam(pool, { q1: "B", q2: "B" })).toThrow(InvalidExamAnswersError);
});

test("não aceita pergunta que não é do banco da fase", () => {
  const answers: Record<string, string> = { outra: "B" };
  pool.slice(0, 9).forEach((q) => {
    answers[q.id] = "B";
  });
  expect(() => gradePhaseExam(pool, answers)).toThrow(InvalidExamAnswersError);
});

test("banco pequeno exige responder todas as perguntas dele", () => {
  const small = pool.slice(0, 4);
  const grade = gradePhaseExam(small, { q1: "B", q2: "B", q3: "C", q4: "B" });
  expect(grade.correctCount).toBe(3);
  expect(grade.totalQuestions).toBe(4);
});

test("lição antiga conta todas as perguntas, em branco vira erro", () => {
  const grade = gradeFullLesson(pool.slice(0, 3), { q1: "B" });
  expect(grade.correctCount).toBe(1);
  expect(grade.totalQuestions).toBe(3);
  expect(grade.review[2]?.selectedOptionId).toBe(null);
});

const catalog: ExtraCourseCandidate[] = [
  {
    id: "web",
    title: "Fundamentos de Desenvolvimento Web",
    provider: "Youtube",
    thumbnail: "web.jpg",
    externalUrl: "https://youtube.com/web",
    tags: ["HTML", "CSS", "JavaScript", "Lógica de Programação"],
    areas: ["Desenvolvimento de Software"],
  },
  {
    id: "dados",
    title: "Python para Dados",
    provider: "Youtube",
    thumbnail: "dados.jpg",
    externalUrl: "https://youtube.com/dados",
    tags: ["Python", "Dados", "Pandas", "SQL"],
    areas: ["Dados e Inteligência Artificial"],
  },
  {
    id: "ux",
    title: "Fundamentos de UI e UX",
    provider: "YouTube",
    thumbnail: "ux.jpg",
    externalUrl: "https://youtube.com/ux",
    tags: ["UI", "UX", "Figma", "Acessibilidade"],
    areas: ["Design e Experiência do Usuário"],
  },
];

const noProfile = { technologies: [], areasSecundarias: [] };

test("extras só trazem cursos do tema da fase", () => {
  const extras = pickExtraResources(catalog, ["HTML"], noProfile);
  expect(extras.map((extra) => extra.id)).toEqual(["web"]);
  expect(extras[0]?.reason ?? "").toMatch(/aprofundar HTML/);
});

test("extras ignoram acento e caixa nas tags", () => {
  const extras = pickExtraResources(catalog, ["logica de programacao"], noProfile);
  expect(extras.map((extra) => extra.id)).toEqual(["web"]);
});

test("o perfil do quiz ordena os extras e explica o motivo", () => {
  const extras = pickExtraResources(catalog, ["SQL", "JavaScript"], {
    technologies: ["python"],
    areasSecundarias: [],
  });

  expect(extras.map((extra) => extra.id)).toEqual(["dados", "web"]);
  expect(extras[0]?.reason).toBe("Seu quiz indicou Python.");
});

test("área secundária do quiz também pesa no motivo", () => {
  const extras = pickExtraResources(catalog, ["SQL"], {
    technologies: [],
    areasSecundarias: ["Dados e Inteligência Artificial"],
  });
  expect(extras[0]?.reason).toBe("Conecta com Dados e Inteligência Artificial, uma das suas áreas secundárias.");
});

test("extras não repetem o que já está na fase e respeitam o limite", () => {
  expect(pickExtraResources(catalog, ["HTML"], noProfile, ["https://youtube.com/web"])).toEqual([]);
  expect(pickExtraResources(catalog, ["HTML", "SQL", "UX"], noProfile).length).toBe(2);
  expect(pickExtraResources(catalog, [], noProfile)).toEqual([]);
});

test("thumbnail sai do id do vídeo do YouTube", () => {
  expect(youtubeThumbnail("https://www.youtube.com/watch?v=E6CdIawPTh0")).toBe("https://i.ytimg.com/vi/E6CdIawPTh0/hqdefault.jpg");
  expect(youtubeThumbnail("https://www.youtube.com/watch?list=PL1&v=-i1JVMspDJQ")).toBe("https://i.ytimg.com/vi/-i1JVMspDJQ/hqdefault.jpg");
  expect(youtubeThumbnail("https://example.com/artigo")).toBe(null);
});
