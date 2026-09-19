import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { awardGamificationPoints } from "../../gamification/services/gamification.service";

export interface ReviewQuestionDTO {
  id: string;
  statement: string;
  sequence: number;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface ReviewQuestionsResponse {
  sessionId: string;
  topicId: string;
  topicTitle: string;
  /** True when the user already completed this topic before (retakes earn no XP). */
  alreadyCompleted: boolean;
  questions: ReviewQuestionDTO[];
}

export interface SubmitReviewAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface QuestionResultDTO {
  [key: string]: string | number | boolean;
  questionId: string;
  statement: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface SubmitReviewResponse {
  sessionId: string;
  topicId: string;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  /** False when the topic had already been completed by this user (training mode, 0 XP). */
  isFirstCompletion: boolean;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
  results: QuestionResultDTO[];
}

import {
  AreaData,
  CourseData,
  GeneratedQuestionItem,
  generateQuestionsForArea,
  generateQuestionsForCourse,
} from "./generateReviewQuestions.service";
import { AREA_TOPIC_PREFIX, COURSE_TOPIC_PREFIX, resolveAreaFromSlug } from "../utils/areaTopic";

export interface ReviewRepository {
  findTopic: (topicId: string) => Promise<{ id: string; title: string; isActive: boolean } | null>;
  findQuestionsByTopic: (topicId: string) => Promise<Array<{
    id: string;
    statement: string;
    sequence: number;
    options: unknown;
    correctOptionId: string;
    explanation: string;
    isActive: boolean;
  }>>;
  createSession: (data: {
    userId: string;
    topicId: string;
    totalQuestions: number;
  }) => Promise<{ id: string }>;
  findSession: (sessionId: string) => Promise<{
    id: string;
    userId: string;
    topicId: string;
    status: string;
    topic: { id: string; title: string };
  } | null>;
  updateSession: (sessionId: string, data: {
    status: string;
    score: number;
    totalQuestions: number;
    xpEarned: number;
    answers: Prisma.InputJsonValue;
    completedAt: Date;
  }) => Promise<unknown>;
  hasCompletedSession: (userId: string, topicId: string) => Promise<boolean>;
  findCourseById?: (courseId: string) => Promise<CourseData | null>;
  findDiagnosisByUser?: (userId: string) => Promise<{
    areaPrincipal: string;
    tecnologiasSugeridas: string[];
  } | null>;
  createTopicWithQuestions?: (
    topicData: { id: string; title: string; description: string },
    questions: GeneratedQuestionItem[],
  ) => Promise<void>;
}

const defaultRepository: ReviewRepository = {
  findTopic: async (topicId) => {
    return prisma.topic.findFirst({
      where: { id: topicId, isActive: true },
      select: { id: true, title: true, isActive: true },
    });
  },
  findQuestionsByTopic: async (topicId) => {
    return prisma.knowledgeReviewQuestion.findMany({
      where: { topicId, isActive: true },
      orderBy: { sequence: "asc" },
      select: {
        id: true,
        statement: true,
        sequence: true,
        options: true,
        correctOptionId: true,
        explanation: true,
        isActive: true,
      },
    });
  },
  createSession: async (data) => {
    return prisma.knowledgeReviewSession.create({
      data: {
        userId: data.userId,
        topicId: data.topicId,
        totalQuestions: data.totalQuestions,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });
  },
  findSession: async (sessionId) => {
    return prisma.knowledgeReviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        topicId: true,
        status: true,
        topic: { select: { id: true, title: true } },
      },
    });
  },
  updateSession: async (sessionId, data) => {
    return prisma.knowledgeReviewSession.update({
      where: { id: sessionId },
      data,
    });
  },
  hasCompletedSession: async (userId, topicId) => {
    const completed = await prisma.knowledgeReviewSession.findFirst({
      where: { userId, topicId, status: "COMPLETED" },
      select: { id: true },
    });
    return completed !== null;
  },
  findDiagnosisByUser: async (userId) => {
    const diagnosis = await prisma.vocationalDiagnosis.findUnique({
      where: { userId },
      select: { areaPrincipal: true, tecnologiasSugeridas: true },
    });
    if (!diagnosis) return null;
    return {
      areaPrincipal: diagnosis.areaPrincipal,
      tecnologiasSugeridas: Array.isArray(diagnosis.tecnologiasSugeridas)
        ? (diagnosis.tecnologiasSugeridas as unknown[]).filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    };
  },
  findCourseById: async (courseId) => {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isActive: true },
      select: { id: true, title: true, provider: true, level: true, tags: true },
    });
    if (!course) return null;
    return {
      id: course.id,
      title: course.title,
      provider: course.provider,
      level: course.level,
      tags: Array.isArray(course.tags) ? (course.tags as string[]) : [],
    };
  },
  createTopicWithQuestions: async (topicData, generatedQuestions) => {
    await prisma.topic.upsert({
      where: { id: topicData.id },
      update: {
        title: topicData.title,
        description: topicData.description,
        isActive: true,
      },
      create: {
        id: topicData.id,
        title: topicData.title,
        description: topicData.description,
        isActive: true,
      },
    });

    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      const questionId = `${topicData.id}-q${i + 1}`;
      await prisma.knowledgeReviewQuestion.upsert({
        where: { id: questionId },
        update: {
          statement: q.statement,
          sequence: i + 1,
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
          isActive: true,
        },
        create: {
          id: questionId,
          topicId: topicData.id,
          statement: q.statement,
          sequence: i + 1,
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
          isActive: true,
        },
      });
    }
  },
};

export interface ReviewAiGenerators {
  forCourse: (course: CourseData) => Promise<GeneratedQuestionItem[]>;
  forArea: (area: AreaData) => Promise<GeneratedQuestionItem[]>;
}

const defaultAiGenerators: ReviewAiGenerators = {
  forCourse: generateQuestionsForCourse,
  forArea: generateQuestionsForArea,
};

/**
 * Generates and persists AI questions for a `course-topic-*` topic. Returns false when the
 * topic id does not reference an existing course.
 */
async function ensureCourseTopic(
  topicId: string,
  repository: ReviewRepository,
  generators: ReviewAiGenerators,
): Promise<boolean> {
  if (!repository.findCourseById || !repository.createTopicWithQuestions) return false;

  const courseId = topicId.slice(COURSE_TOPIC_PREFIX.length);
  const course = await repository.findCourseById(courseId);
  if (!course) return false;

  const generated = await generators.forCourse(course);
  await repository.createTopicWithQuestions(
    {
      id: topicId,
      title: `Revisão: ${course.title}`,
      description: `Perguntas didáticas geradas por IA para o curso ${course.title} (${course.level})`,
    },
    generated,
  );
  return true;
}

/**
 * Generates and persists AI questions for an `area-topic-<slug>` topic, using the user's
 * suggested technologies from the vocational diagnosis as context. Cached per area.
 */
async function ensureAreaTopic(
  userId: string,
  topicId: string,
  repository: ReviewRepository,
  generators: ReviewAiGenerators,
): Promise<boolean> {
  if (!repository.createTopicWithQuestions) return false;

  const area = resolveAreaFromSlug(topicId.slice(AREA_TOPIC_PREFIX.length));
  if (!area) return false;

  const diagnosis = repository.findDiagnosisByUser
    ? await repository.findDiagnosisByUser(userId)
    : null;
  const technologies =
    diagnosis && diagnosis.areaPrincipal === area ? diagnosis.tecnologiasSugeridas : [];

  const generated = await generators.forArea({ name: area, technologies });
  await repository.createTopicWithQuestions(
    {
      id: topicId,
      title: `Revisão: ${area}`,
      description: `Perguntas didáticas geradas por IA sobre os fundamentos da área ${area}`,
    },
    generated,
  );
  return true;
}

export async function getReviewQuestionsService(
  userId: string,
  topicId: string,
  repository: ReviewRepository = defaultRepository,
  generators: ReviewAiGenerators = defaultAiGenerators,
): Promise<ReviewQuestionsResponse> {
  let topic = await repository.findTopic(topicId);

  // Dynamic topics (course / area) are generated by AI on first access and cached in the DB
  if (!topic) {
    let created = false;
    if (topicId.startsWith(COURSE_TOPIC_PREFIX)) {
      created = await ensureCourseTopic(topicId, repository, generators);
    } else if (topicId.startsWith(AREA_TOPIC_PREFIX)) {
      created = await ensureAreaTopic(userId, topicId, repository, generators);
    }
    if (created) {
      topic = await repository.findTopic(topicId);
    }
  }

  if (!topic) {
    throw new AppError("Tópico de revisão não encontrado ou inativo.", 404);
  }

  const [rawQuestions, alreadyCompleted] = await Promise.all([
    repository.findQuestionsByTopic(topicId),
    repository.hasCompletedSession(userId, topicId),
  ]);

  const session = await repository.createSession({
    userId,
    topicId,
    totalQuestions: rawQuestions.length,
  });

  const questions: ReviewQuestionDTO[] = rawQuestions.map((q) => {
    const parsedOptions = Array.isArray(q.options)
      ? (q.options as Array<{ id: string; label: string }>)
      : [];

    return {
      id: q.id,
      statement: q.statement,
      sequence: q.sequence,
      options: parsedOptions,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
    };
  });

  return {
    sessionId: session.id,
    topicId: topic.id,
    topicTitle: topic.title,
    alreadyCompleted,
    questions,
  };
}

export async function submitReviewService(
  userId: string,
  sessionId: string,
  answers: SubmitReviewAnswerInput[],
  repository: ReviewRepository = defaultRepository,
  awardGamification: typeof awardGamificationPoints = awardGamificationPoints,
): Promise<SubmitReviewResponse> {
  const session = await repository.findSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new AppError("Sessão de revisão não encontrada.", 404);
  }
  if (session.status === "COMPLETED") {
    throw new AppError("Esta sessão de revisão já foi finalizada.", 409);
  }

  // XP is only awarded on the first completion of a topic; retakes are training mode
  const isFirstCompletion = !(await repository.hasCompletedSession(userId, session.topicId));

  const questions = await repository.findQuestionsByTopic(session.topicId);
  const questionsMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  const results: QuestionResultDTO[] = [];

  for (const ans of answers) {
    const q = questionsMap.get(ans.questionId);
    if (!q) continue;

    const isCorrect = ans.selectedOptionId === q.correctOptionId;
    if (isCorrect) {
      score += 1;
    }

    results.push({
      questionId: q.id,
      statement: q.statement,
      selectedOptionId: ans.selectedOptionId,
      correctOptionId: q.correctOptionId,
      isCorrect,
      explanation: q.explanation,
    });
  }

  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  // Award 10 XP per correct question (ex: 4 of 5 = 40 XP, matching epic spec)
  const xpEarned = isFirstCompletion ? score * 10 : 0;

  const gamificationResult = await awardGamification(prisma, {
    userId,
    xpEarned,
  });

  await repository.updateSession(sessionId, {
    status: "COMPLETED",
    score,
    totalQuestions,
    xpEarned,
    answers: results,
    completedAt: new Date(),
  });

  return {
    sessionId: session.id,
    topicId: session.topic.id,
    topicTitle: session.topic.title,
    score,
    totalQuestions,
    percentage,
    xpEarned,
    isFirstCompletion,
    totalXp: gamificationResult.xp,
    currentStreak: gamificationResult.currentStreak,
    longestStreak: gamificationResult.longestStreak,
    streakIncremented: gamificationResult.streakIncremented,
    results,
  };
}
