import assert from "node:assert/strict";
import test from "node:test";
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

  assert.deepEqual([...output].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test("a prova sorteia 10 perguntas distintas do banco, com as alternativas embaralhadas", () => {
  const exam = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(42));

  assert.equal(exam.length, PHASE_EXAM_SIZE);
  assert.equal(new Set(exam.map((q) => q.id)).size, PHASE_EXAM_SIZE);
  for (const drawn of exam) {
    assert.deepEqual(
      drawn.options.map((option) => option.id).sort(),
      ["A", "B", "C", "D"],
      "embaralhar não pode perder nem trocar o id das alternativas",
    );
  }
});

test("tentativas diferentes sorteiam provas diferentes", () => {
  const first = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(1)).map((q) => q.id);
  const second = drawExam(pool, PHASE_EXAM_SIZE, seededRandom(2)).map((q) => q.id);
  assert.notDeepEqual(first, second);
});

test("banco menor que a prova serve tudo o que tem", () => {
  assert.equal(drawExam(pool.slice(0, 6), PHASE_EXAM_SIZE, seededRandom(3)).length, 6);
});

test("a correção devolve acertos e o feedback de cada pergunta", () => {
  const answers: Record<string, string> = {};
  pool.slice(0, 10).forEach((q, index) => {
    answers[q.id] = index < 7 ? "B" : "A";
  });

  const grade = gradePhaseExam(pool, answers);

  assert.equal(grade.correctCount, 7);
  assert.equal(grade.totalQuestions, 10);
  const wrong = grade.review.find((item) => item.questionId === "q9");
  assert.deepEqual(
    {
      selected: wrong?.selectedOptionId,
      correct: wrong?.correctOptionId,
      isCorrect: wrong?.isCorrect,
      explanation: wrong?.explanation,
    },
    { selected: "A", correct: "B", isCorrect: false, explanation: "Porque B na 9" },
  );
});

test("não aceita prova incompleta — responder só as que sabe não passa", () => {
  assert.throws(
    () => gradePhaseExam(pool, { q1: "B", q2: "B" }),
    InvalidExamAnswersError,
  );
});

test("não aceita pergunta que não é do banco da fase", () => {
  const answers: Record<string, string> = { outra: "B" };
  pool.slice(0, 9).forEach((q) => {
    answers[q.id] = "B";
  });
  assert.throws(() => gradePhaseExam(pool, answers), InvalidExamAnswersError);
});

test("banco pequeno exige responder todas as perguntas dele", () => {
  const small = pool.slice(0, 4);
  const grade = gradePhaseExam(small, { q1: "B", q2: "B", q3: "C", q4: "B" });
  assert.equal(grade.correctCount, 3);
  assert.equal(grade.totalQuestions, 4);
});

test("lição antiga conta todas as perguntas, em branco vira erro", () => {
  const grade = gradeFullLesson(pool.slice(0, 3), { q1: "B" });
  assert.equal(grade.correctCount, 1);
  assert.equal(grade.totalQuestions, 3);
  assert.equal(grade.review[2]?.selectedOptionId, null);
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
  assert.deepEqual(extras.map((extra) => extra.id), ["web"]);
  assert.match(extras[0]?.reason ?? "", /aprofundar HTML/);
});

test("extras ignoram acento e caixa nas tags", () => {
  const extras = pickExtraResources(catalog, ["logica de programacao"], noProfile);
  assert.deepEqual(extras.map((extra) => extra.id), ["web"]);
});

test("o perfil do quiz ordena os extras e explica o motivo", () => {
  const extras = pickExtraResources(catalog, ["SQL", "JavaScript"], {
    technologies: ["python"],
    areasSecundarias: [],
  });

  assert.deepEqual(extras.map((extra) => extra.id), ["dados", "web"]);
  assert.equal(extras[0]?.reason, "Seu quiz indicou Python.");
});

test("área secundária do quiz também pesa no motivo", () => {
  const extras = pickExtraResources(catalog, ["SQL"], {
    technologies: [],
    areasSecundarias: ["Dados e Inteligência Artificial"],
  });
  assert.equal(extras[0]?.reason, "Conecta com Dados e Inteligência Artificial, uma das suas áreas secundárias.");
});

test("extras não repetem o que já está na fase e respeitam o limite", () => {
  assert.deepEqual(
    pickExtraResources(catalog, ["HTML"], noProfile, ["https://youtube.com/web"]),
    [],
  );
  assert.equal(pickExtraResources(catalog, ["HTML", "SQL", "UX"], noProfile).length, 2);
  assert.deepEqual(pickExtraResources(catalog, [], noProfile), []);
});

test("thumbnail sai do id do vídeo do YouTube", () => {
  assert.equal(
    youtubeThumbnail("https://www.youtube.com/watch?v=E6CdIawPTh0"),
    "https://i.ytimg.com/vi/E6CdIawPTh0/hqdefault.jpg",
  );
  assert.equal(
    youtubeThumbnail("https://www.youtube.com/watch?list=PL1&v=-i1JVMspDJQ"),
    "https://i.ytimg.com/vi/-i1JVMspDJQ/hqdefault.jpg",
  );
  assert.equal(youtubeThumbnail("https://example.com/artigo"), null);
});
