import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import {
  AiQuestionGenerationError,
  generateQuestionsForPhase,
} from "../../reviews/services/generateReviewQuestions.service";
import { isPhaseUnlocked } from "./trailMapRules";
import { loadPhaseGate } from "./getTrailMap.service";

export interface PhaseQuestion {
  id: string;
  statement: string;
  sequence: number;
  options: Array<{ id: string; label: string }>;
}

export interface PhaseResource {
  id: string;
  title: string;
  url: string;
  kind: string;
  thumbnail: string | null;
  provider: string | null;
}

export interface TrailPhaseResponse {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  kind: string;
  xpReward: number;
  passingScore: number;
  unitTitle: string;
  resources: PhaseResource[];
  questions: PhaseQuestion[];
}

/**
 * Carrega uma fase para ser jogada. Aplica o gate no servidor e garante que
 * a prova exista — gerando-a por IA na primeira visita e cacheando no banco.
 */
export async function getTrailPhase(
  userId: string,
  lessonId: string,
): Promise<TrailPhaseResponse> {
  const lesson = await prisma.trailLesson.findFirst({
    where: { id: lessonId, isActive: true, trail: { isActive: true } },
    include: {
      unit: { select: { title: true } },
      trail: { select: { area: true } },
      resources: {
        orderBy: { sequence: "asc" },
        include: { course: { select: { thumbnail: true, provider: true } } },
      },
    },
  });

  if (!lesson) {
    throw new AppError("Fase não encontrada.", 404);
  }

  const gate = await loadPhaseGate(userId, lessonId);
  if (gate && !isPhaseUnlocked(gate, lessonId)) {
    throw new AppError("Conclua a fase anterior para liberar esta.", 403);
  }

  const questions = await ensurePhaseQuestions(lesson.id, {
    title: lesson.title,
    description: lesson.description,
    unitTitle: lesson.unit?.title ?? lesson.title,
    area: lesson.trail.area ?? "Tecnologia",
    resourceTitles: lesson.resources.map((resource) => resource.title),
  });

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    sequence: lesson.sequence,
    kind: lesson.kind,
    xpReward: lesson.xpReward,
    passingScore: lesson.passingScore,
    unitTitle: lesson.unit?.title ?? "",
    resources: lesson.resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      kind: resource.kind,
      thumbnail: resource.course?.thumbnail ?? null,
      provider: resource.course?.provider ?? null,
    })),
    questions,
  };
}

type PhaseContext = Parameters<typeof generateQuestionsForPhase>[0];

/**
 * As questões são geradas uma vez por fase e ficam no banco. O gabarito
 * (`correctAnswer`) nunca sai daqui — a correção é sempre no servidor.
 */
export async function ensurePhaseQuestions(
  lessonId: string,
  context: PhaseContext,
): Promise<PhaseQuestion[]> {
  const existing = await loadQuestions(lessonId);
  if (existing.length > 0) return existing;

  let generated;
  try {
    generated = await generateQuestionsForPhase(context);
  } catch (error) {
    if (error instanceof AiQuestionGenerationError) {
      throw new AppError(
        "A prova desta fase ainda não pôde ser preparada. Tente novamente em instantes.",
        503,
        error.retryAfterMs !== null ? { retryAfterMs: error.retryAfterMs } : undefined,
      );
    }
    throw error;
  }

  await prisma.trailQuestion.createMany({
    data: generated.map((question, index) => ({
      lessonId,
      statement: question.statement,
      type: "MULTIPLE_CHOICE",
      sequence: index + 1,
      options: question.options,
      correctAnswer: question.correctOptionId,
      explanation: question.explanation,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  return loadQuestions(lessonId);
}

async function loadQuestions(lessonId: string): Promise<PhaseQuestion[]> {
  const questions = await prisma.trailQuestion.findMany({
    where: { lessonId, isActive: true },
    orderBy: { sequence: "asc" },
    select: { id: true, statement: true, sequence: true, options: true },
  });

  return questions.map((question) => ({
    id: question.id,
    statement: question.statement,
    sequence: question.sequence,
    options: Array.isArray(question.options)
      ? (question.options as Array<{ id: string; label: string }>)
      : [],
  }));
}
