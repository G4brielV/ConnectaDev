import { expect, test } from "vitest";
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

  await expect(
    getReviewQuestionsService("user-1", "non-existent-topic", repository),
  ).rejects.toMatchObject({
    statusCode: 404,
    message: "Tópico de revisão não encontrado ou inativo.",
  });
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

  expect(response.sessionId).toBe("session-123");
  expect(response.topicId).toBe("topic-1");
  expect(response.topicTitle).toBe("Lógica e Algoritmos");
  expect(response.alreadyCompleted).toBe(false);
  expect(response.questions.length).toBe(2);
  expect(response.questions[0].id).toBe("q-1");
  expect(response.questions[0].correctOptionId).toBe("A");
  expect(response.questions[0].explanation).toBe("Justificativa 1");
  expect(createdSessionData).toEqual({
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
    totalXp: 140,
    currentLevel: 2,
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

  expect(result.score).toBe(4);
  expect(result.totalQuestions).toBe(5);
  expect(result.percentage).toBe(80);
  expect(result.xpEarned).toBe(40); // 4 * 10 XP
  expect(result.isFirstCompletion).toBe(true);
  expect(result.totalXp).toBe(140);
  expect(result.currentStreak).toBe(3);
  expect(result.results.length).toBe(5);
  expect(result.results[0].isCorrect).toBe(true);
  expect(result.results[4].isCorrect).toBe(false);
  expect(result.results[4].selectedOptionId).toBe("B");
  expect(result.results[4].correctOptionId).toBe("A");
  expect(result.results[4].explanation).toBe("Justificativa 5");

  expect(updatedSession).toBeTruthy();
});

test("calculateNewStreak handles streak transitions correctly", () => {
  const day1 = new Date("2026-09-10T12:00:00Z");
  const day2 = new Date("2026-09-11T12:00:00Z");
  const day4 = new Date("2026-09-13T12:00:00Z");

  // First time ever
  const firstTime = calculateNewStreak(null, 0, 0, day1);
  expect(firstTime.newCurrentStreak).toBe(1);
  expect(firstTime.newLongestStreak).toBe(1);
  expect(firstTime.streakIncremented).toBe(true);

  // Same day
  const sameDay = calculateNewStreak(day1, 1, 1, new Date("2026-09-10T18:00:00Z"));
  expect(sameDay.newCurrentStreak).toBe(1);
  expect(sameDay.newLongestStreak).toBe(1);
  expect(sameDay.streakIncremented).toBe(false);

  // Next day
  const nextDay = calculateNewStreak(day1, 1, 1, day2);
  expect(nextDay.newCurrentStreak).toBe(2);
  expect(nextDay.newLongestStreak).toBe(2);
  expect(nextDay.streakIncremented).toBe(true);

  // Missed day
  const missedDay = calculateNewStreak(day1, 5, 10, day4);
  expect(missedDay.newCurrentStreak).toBe(1);
  expect(missedDay.newLongestStreak).toBe(10);
  expect(missedDay.streakIncremented).toBe(true);
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

  expect(result.sessionId).toBe("session-ai-1");
  expect(result.topicTitle).toBe("Revisão: JavaScript Moderno");
  expect(result.questions.length).toBe(1);
  expect(createdTopic).toBeTruthy();
  expect(createdQuestionsCount).toBe(1);
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

  await expect(
    submitReviewService(
      "user-1",
      "session-done",
      [{ questionId: "q-1", selectedOptionId: "A" }],
      repository,
    ),
  ).rejects.toMatchObject({
    statusCode: 409,
    message: "Esta sessão de revisão já foi finalizada.",
  });
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
    return {
      totalXp: 50,
      currentLevel: 1,
      xpEarned: params.xpEarned,
      currentStreak: 2,
      longestStreak: 2,
      streakIncremented: true,
    };
  };

  const result = await submitReviewService(
    "user-1",
    "session-retake",
    [{ questionId: "q-1", selectedOptionId: "A" }],
    repository,
    mockGamification,
  );

  expect(result.score).toBe(1);
  expect(result.xpEarned).toBe(0);
  expect(result.isFirstCompletion).toBe(false);
  expect(result.totalXp).toBe(50);
  expect(result.streakIncremented).toBe(true);
  expect(gamificationCall).toEqual({ userId: "user-1", xpEarned: 0 });
  expect(updatedSession).toEqual({ xpEarned: 0, status: "COMPLETED" });
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
  expect(response.alreadyCompleted).toBe(true);
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

  expect(result.sessionId).toBe("session-area-1");
  expect(result.topicTitle).toBe("Revisão: Cibersegurança");
  expect(areaInput).toEqual({ name: "Cibersegurança", technologies: ["Linux", "Wireshark"] });
  expect(createdTopic).toEqual({ id: "area-topic-ciberseguranca", title: "Revisão: Cibersegurança" });
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

  await expect(
    getReviewQuestionsService("user-1", "area-topic-astrologia", repository, {
      forCourse: async () => [],
      forArea: async () => {
        generatorCalled = true;
        return [];
      },
    }),
  ).rejects.toMatchObject({ statusCode: 404 });

  expect(generatorCalled).toBe(false);
});

test("area slugs round-trip for every supported area", () => {
  for (const area of SUPPORTED_AREAS) {
    const slug = slugifyArea(area);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(resolveAreaFromSlug(slug)).toBe(area);
  }
  expect(slugifyArea("Dados e Inteligência Artificial")).toBe("dados-e-inteligencia-artificial");
  expect(resolveAreaFromSlug("nao-existe")).toBeNull();
});