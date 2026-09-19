import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNewStreak,
  getDayDifference,
} from "../src/modules/gamification/services/gamification.service";
import {
  getReviewQuestionsService,
  submitReviewService,
  ReviewRepository,
} from "../src/modules/reviews/services/review.service";
import { SUPPORTED_AREAS } from "../src/modules/quiz/constants/areas";
import {
  areaTopicId,
  resolveAreaFromSlug,
  slugifyArea,
} from "../src/modules/reviews/utils/areaTopic";

test("getReviewQuestionsService throws 404 if topic not found", async () => {
  const repository: ReviewRepository = {
    findTopic: async () => null,
    findQuestionsByTopic: async () => [],
    createSession: async () => ({ id: "s-1" }),
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async () => false,
  };

  await assert.rejects(
    () => getReviewQuestionsService("user-1", "non-existent-topic", repository),
    { statusCode: 404, message: "Tópico de revisão não encontrado ou inativo." },
  );
});

test("getReviewQuestionsService creates session and returns ordered questions", async () => {
  let createdSessionData: unknown = null;

  const mockQuestions = [
    {
      id: "q-1",
      statement: "Pergunta 1",
      sequence: 1,
      options: [
        { id: "A", label: "Opção A" },
        { id: "B", label: "Opção B" },
      ],
      correctOptionId: "A",
      explanation: "Justificativa 1",
      isActive: true,
    },
    {
      id: "q-2",
      statement: "Pergunta 2",
      sequence: 2,
      options: [
        { id: "A", label: "Opção A" },
        { id: "B", label: "Opção B" },
      ],
      correctOptionId: "B",
      explanation: "Justificativa 2",
      isActive: true,
    },
  ];

  const repository: ReviewRepository = {
    findTopic: async (id) => ({ id, title: "Lógica e Algoritmos", isActive: true }),
    findQuestionsByTopic: async () => mockQuestions,
    createSession: async (data) => {
      createdSessionData = data;
      return { id: "session-123" };
    },
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async () => false,
  };

  const response = await getReviewQuestionsService("user-1", "topic-1", repository);

  assert.equal(response.sessionId, "session-123");
  assert.equal(response.topicId, "topic-1");
  assert.equal(response.topicTitle, "Lógica e Algoritmos");
  assert.equal(response.alreadyCompleted, false);
  assert.equal(response.questions.length, 2);
  assert.equal(response.questions[0].id, "q-1");
  assert.equal(response.questions[0].correctOptionId, "A");
  assert.equal(response.questions[0].explanation, "Justificativa 1");
  assert.deepEqual(createdSessionData, {
    userId: "user-1",
    topicId: "topic-1",
    totalQuestions: 2,
  });
});

test("submitReviewService validates session ownership and computes score / XP", async () => {
  const mockQuestions = [
    {
      id: "q-1",
      statement: "Pergunta 1",
      sequence: 1,
      options: [],
      correctOptionId: "A",
      explanation: "Justificativa 1",
      isActive: true,
    },
    {
      id: "q-2",
      statement: "Pergunta 2",
      sequence: 2,
      options: [],
      correctOptionId: "B",
      explanation: "Justificativa 2",
      isActive: true,
    },
    {
      id: "q-3",
      statement: "Pergunta 3",
      sequence: 3,
      options: [],
      correctOptionId: "C",
      explanation: "Justificativa 3",
      isActive: true,
    },
    {
      id: "q-4",
      statement: "Pergunta 4",
      sequence: 4,
      options: [],
      correctOptionId: "D",
      explanation: "Justificativa 4",
      isActive: true,
    },
    {
      id: "q-5",
      statement: "Pergunta 5",
      sequence: 5,
      options: [],
      correctOptionId: "A",
      explanation: "Justificativa 5",
      isActive: true,
    },
  ];

  let updatedSession: unknown = null;

  const repository: ReviewRepository = {
    findTopic: async () => null,
    findQuestionsByTopic: async () => mockQuestions,
    createSession: async () => ({ id: "s-1" }),
    findSession: async (sessionId) => {
      if (sessionId !== "session-123") return null;
      return {
        id: "session-123",
        userId: "user-1",
        topicId: "topic-1",
        status: "IN_PROGRESS",
        topic: { id: "topic-1", title: "Lógica" },
      };
    },
    updateSession: async (_id, data) => {
      updatedSession = data;
      return {};
    },
    hasCompletedSession: async () => false,
  };

  const mockGamification = async () => ({
    xp: 140,
    xpEarned: 40,
    currentStreak: 3,
    longestStreak: 5,
    streakIncremented: true,
  });

  // User gets 4 out of 5 correct (q-1 to q-4 right, q-5 wrong)
  const answers = [
    { questionId: "q-1", selectedOptionId: "A" }, // correct
    { questionId: "q-2", selectedOptionId: "B" }, // correct
    { questionId: "q-3", selectedOptionId: "C" }, // correct
    { questionId: "q-4", selectedOptionId: "D" }, // correct
    { questionId: "q-5", selectedOptionId: "B" }, // wrong (correct is A)
  ];

  const result = await submitReviewService(
    "user-1",
    "session-123",
    answers,
    repository,
    mockGamification,
  );

  assert.equal(result.score, 4);
  assert.equal(result.totalQuestions, 5);
  assert.equal(result.percentage, 80);
  assert.equal(result.xpEarned, 40); // 4 * 10 XP
  assert.equal(result.isFirstCompletion, true);
  assert.equal(result.totalXp, 140);
  assert.equal(result.currentStreak, 3);
  assert.equal(result.results.length, 5);
  assert.equal(result.results[0].isCorrect, true);
  assert.equal(result.results[4].isCorrect, false);
  assert.equal(result.results[4].selectedOptionId, "B");
  assert.equal(result.results[4].correctOptionId, "A");
  assert.equal(result.results[4].explanation, "Justificativa 5");

  assert.ok(updatedSession);
});

test("calculateNewStreak handles streak transitions correctly", () => {
  const day1 = new Date("2026-09-10T12:00:00Z");
  const day2 = new Date("2026-09-11T12:00:00Z");
  const day4 = new Date("2026-09-13T12:00:00Z");

  // First time ever
  const firstTime = calculateNewStreak(null, 0, 0, day1);
  assert.equal(firstTime.newCurrentStreak, 1);
  assert.equal(firstTime.newLongestStreak, 1);
  assert.equal(firstTime.streakIncremented, true);

  // Same day
  const sameDay = calculateNewStreak(day1, 1, 1, new Date("2026-09-10T18:00:00Z"));
  assert.equal(sameDay.newCurrentStreak, 1);
  assert.equal(sameDay.newLongestStreak, 1);
  assert.equal(sameDay.streakIncremented, false);

  // Next day
  const nextDay = calculateNewStreak(day1, 1, 1, day2);
  assert.equal(nextDay.newCurrentStreak, 2);
  assert.equal(nextDay.newLongestStreak, 2);
  assert.equal(nextDay.streakIncremented, true);

  // Missed day
  const missedDay = calculateNewStreak(day1, 5, 10, day4);
  assert.equal(missedDay.newCurrentStreak, 1);
  assert.equal(missedDay.newLongestStreak, 10);
  assert.equal(missedDay.streakIncremented, true);
});

test("getReviewQuestionsService dynamically generates AI questions for an unindexed course topic", async () => {
  let createdTopic: unknown = null;
  let createdQuestionsCount = 0;
  let topicQueried = false;

  const repository: ReviewRepository = {
    findTopic: async (id) => {
      if (topicQueried) {
        return { id, title: "Revisão: JavaScript Moderno", isActive: true };
      }
      return null;
    },
    findCourseById: async (courseId) => {
      if (courseId === "course-js") {
        return {
          id: "course-js",
          title: "JavaScript Moderno",
          provider: "YouTube",
          level: "Iniciante",
          tags: ["JavaScript", "ES6"],
        };
      }
      return null;
    },
    createTopicWithQuestions: async (topic, questions) => {
      createdTopic = topic;
      createdQuestionsCount = questions.length;
      topicQueried = true;
    },
    findQuestionsByTopic: async () => [
      {
        id: "q-1",
        statement: "O que é const?",
        sequence: 1,
        options: [{ id: "A", label: "Constante" }],
        correctOptionId: "A",
        explanation: "Const define valor imutável.",
        isActive: true,
      },
    ],
    createSession: async () => ({ id: "session-ai-1" }),
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async () => false,
  };

  const aiMock = async () => [
    {
      statement: "O que é const?",
      options: [
        { id: "A", label: "Constante" },
        { id: "B", label: "Variável" },
        { id: "C", label: "Função" },
        { id: "D", label: "Objeto" },
      ],
      correctOptionId: "A",
      explanation: "Const define valor imutável.",
    },
  ];

  const result = await getReviewQuestionsService(
    "user-1",
    "course-topic-course-js",
    repository,
    { forCourse: aiMock, forArea: async () => [] },
  );

  assert.equal(result.sessionId, "session-ai-1");
  assert.equal(result.topicTitle, "Revisão: JavaScript Moderno");
  assert.equal(result.questions.length, 1);
  assert.ok(createdTopic);
  assert.equal(createdQuestionsCount, 1);
});


const singleQuestion = [
  {
    id: "q-1",
    statement: "Pergunta 1",
    sequence: 1,
    options: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
    correctOptionId: "A",
    explanation: "Justificativa 1",
    isActive: true,
  },
];

test("submitReviewService rejects a session that was already completed (409)", async () => {
  const repository: ReviewRepository = {
    findTopic: async () => null,
    findQuestionsByTopic: async () => singleQuestion,
    createSession: async () => ({ id: "s-1" }),
    findSession: async () => ({
      id: "session-done",
      userId: "user-1",
      topicId: "topic-1",
      status: "COMPLETED",
      topic: { id: "topic-1", title: "Lógica" },
    }),
    updateSession: async () => ({}),
    hasCompletedSession: async () => true,
  };

  await assert.rejects(
    () =>
      submitReviewService(
        "user-1",
        "session-done",
        [{ questionId: "q-1", selectedOptionId: "A" }],
        repository,
      ),
    { statusCode: 409, message: "Esta sessão de revisão já foi finalizada." },
  );
});

test("submitReviewService awards 0 XP on a retake but still registers streak activity", async () => {
  let gamificationCall: { userId: string; xpEarned: number } | null = null;
  let updatedSession: { xpEarned: number; status: string } | null = null;

  const repository: ReviewRepository = {
    findTopic: async () => null,
    findQuestionsByTopic: async () => singleQuestion,
    createSession: async () => ({ id: "s-1" }),
    findSession: async () => ({
      id: "session-retake",
      userId: "user-1",
      topicId: "topic-1",
      status: "IN_PROGRESS",
      topic: { id: "topic-1", title: "Lógica" },
    }),
    updateSession: async (_id, data) => {
      updatedSession = { xpEarned: data.xpEarned, status: data.status };
      return {};
    },
    hasCompletedSession: async () => true,
  };

  const mockGamification = async (_prisma: unknown, params: { userId: string; xpEarned: number }) => {
    gamificationCall = params;
    return { xp: 50, xpEarned: params.xpEarned, currentStreak: 2, longestStreak: 2, streakIncremented: true };
  };

  const result = await submitReviewService(
    "user-1",
    "session-retake",
    [{ questionId: "q-1", selectedOptionId: "A" }],
    repository,
    mockGamification,
  );

  assert.equal(result.score, 1);
  assert.equal(result.xpEarned, 0);
  assert.equal(result.isFirstCompletion, false);
  assert.equal(result.totalXp, 50);
  assert.equal(result.streakIncremented, true);
  assert.deepEqual(gamificationCall, { userId: "user-1", xpEarned: 0 });
  assert.deepEqual(updatedSession, { xpEarned: 0, status: "COMPLETED" });
});

test("getReviewQuestionsService flags alreadyCompleted when the user finished the topic before", async () => {
  const repository: ReviewRepository = {
    findTopic: async (id) => ({ id, title: "Lógica", isActive: true }),
    findQuestionsByTopic: async () => singleQuestion,
    createSession: async () => ({ id: "s-2" }),
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async (userId, topicId) => userId === "user-1" && topicId === "topic-1",
  };

  const response = await getReviewQuestionsService("user-1", "topic-1", repository);
  assert.equal(response.alreadyCompleted, true);
});

test("getReviewQuestionsService generates area questions from the user's diagnosis technologies", async () => {
  let createdTopic: { id: string; title: string } | null = null;
  let areaInput: { name: string; technologies: string[] } | null = null;
  let topicCreated = false;

  const topicId = areaTopicId("Cibersegurança");

  const repository: ReviewRepository = {
    findTopic: async (id) => (topicCreated ? { id, title: "Revisão: Cibersegurança", isActive: true } : null),
    findQuestionsByTopic: async () => singleQuestion,
    createSession: async () => ({ id: "session-area-1" }),
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async () => false,
    findDiagnosisByUser: async () => ({
      areaPrincipal: "Cibersegurança",
      tecnologiasSugeridas: ["Linux", "Wireshark"],
    }),
    createTopicWithQuestions: async (topic) => {
      createdTopic = { id: topic.id, title: topic.title };
      topicCreated = true;
    },
  };

  const result = await getReviewQuestionsService("user-1", topicId, repository, {
    forCourse: async () => [],
    forArea: async (area) => {
      areaInput = area;
      return [];
    },
  });

  assert.equal(result.sessionId, "session-area-1");
  assert.equal(result.topicTitle, "Revisão: Cibersegurança");
  assert.deepEqual(areaInput, { name: "Cibersegurança", technologies: ["Linux", "Wireshark"] });
  assert.deepEqual(createdTopic, { id: "area-topic-ciberseguranca", title: "Revisão: Cibersegurança" });
});

test("getReviewQuestionsService returns 404 for an area slug outside the catalog", async () => {
  let generatorCalled = false;
  const repository: ReviewRepository = {
    findTopic: async () => null,
    findQuestionsByTopic: async () => [],
    createSession: async () => ({ id: "s-1" }),
    findSession: async () => null,
    updateSession: async () => ({}),
    hasCompletedSession: async () => false,
    createTopicWithQuestions: async () => {},
  };

  await assert.rejects(
    () =>
      getReviewQuestionsService("user-1", "area-topic-astrologia", repository, {
        forCourse: async () => [],
        forArea: async () => {
          generatorCalled = true;
          return [];
        },
      }),
    { statusCode: 404 },
  );
  assert.equal(generatorCalled, false);
});

test("area slugs round-trip for every supported area", () => {
  for (const area of SUPPORTED_AREAS) {
    const slug = slugifyArea(area);
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.equal(resolveAreaFromSlug(slug), area);
  }
  assert.equal(slugifyArea("Dados e Inteligência Artificial"), "dados-e-inteligencia-artificial");
  assert.equal(resolveAreaFromSlug("nao-existe"), null);
});
