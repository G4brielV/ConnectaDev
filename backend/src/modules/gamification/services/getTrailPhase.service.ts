import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import {
  AiQuestionGenerationError,
  generateQuestionsForPhase,
  PhaseData,
} from "../../reviews/services/generateReviewQuestions.service";
import { isPhaseUnlocked } from "./trailMapRules";
import { loadPhaseGate } from "./getTrailMap.service";
import {
  drawExam,
  ExamOption,
  PHASE_EXAM_SIZE,
  PHASE_QUESTION_POOL_TARGET,
  toExamOptions,
} from "./phaseExam";
import {
  asStringArray,
  ExtraResource,
  pickExtraResources,
  youtubeThumbnail,
} from "./phaseResources";

export interface PhaseQuestion {
  id: string;
  statement: string;
  sequence: number;
  options: ExamOption[];
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
  /** Cursos do catálogo para aprofundar, escolhidos pelo perfil do quiz. */
  extraResources: ExtraResource[];
  questions: PhaseQuestion[];
}

/** O que a geração da prova precisa saber da fase; também usado pelo script de pré-geração. */
export const PHASE_CONTEXT_INCLUDE = {
  unit: {
    select: {
      title: true,
      lessons: {
        where: { isActive: true },
        orderBy: { sequence: "asc" },
        select: { title: true },
      },
    },
  },
  trail: { select: { area: true } },
  resources: {
    orderBy: { sequence: "asc" },
    include: { course: { select: { thumbnail: true, provider: true } } },
  },
} satisfies Prisma.TrailLessonInclude;

type LessonWithContext = Prisma.TrailLessonGetPayload<{ include: typeof PHASE_CONTEXT_INCLUDE }>;

export function toPhaseContext(lesson: LessonWithContext): PhaseData {
  return {
    title: lesson.title,
    description: lesson.description,
    unitTitle: lesson.unit?.title ?? lesson.title,
    area: lesson.trail.area ?? "Tecnologia",
    resourceTitles: lesson.resources.map((resource) => resource.title),
    kind: lesson.kind,
    unitPhaseTitles: lesson.unit?.lessons.map((phase) => phase.title) ?? [lesson.title],
  };
}

/**
 * Carrega uma fase para ser jogada. Aplica o gate no servidor, garante que o
 * banco de questões exista (gerando por IA na primeira visita) e sorteia a
 * prova desta tentativa.
 */
export async function getTrailPhase(
  userId: string,
  lessonId: string,
): Promise<TrailPhaseResponse> {
  const lesson = await prisma.trailLesson.findFirst({
    where: { id: lessonId, isActive: true, trail: { isActive: true } },
    include: PHASE_CONTEXT_INCLUDE,
  });

  if (!lesson) {
    throw new AppError("Fase não encontrada.", 404);
  }

  const gate = await loadPhaseGate(userId, lessonId);
  if (gate && !isPhaseUnlocked(gate, lessonId)) {
    throw new AppError("Conclua a fase anterior para liberar esta.", 403);
  }

  const pool = await ensurePhaseQuestions(lesson.id, toPhaseContext(lesson));
  const resources = lesson.resources.map((resource): PhaseResource => ({
    id: resource.id,
    title: resource.title,
    url: resource.url,
    kind: resource.kind,
    thumbnail: resource.course?.thumbnail ?? youtubeThumbnail(resource.url),
    provider: resource.provider ?? resource.course?.provider ?? null,
  }));

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    sequence: lesson.sequence,
    kind: lesson.kind,
    xpReward: lesson.xpReward,
    passingScore: lesson.passingScore,
    unitTitle: lesson.unit?.title ?? "",
    resources,
    extraResources: await loadExtraResources(
      userId,
      lesson.tags,
      resources.map((resource) => resource.url),
    ),
    // `sequence` passa a ser a posição na prova sorteada, não no banco.
    questions: drawExam(pool, PHASE_EXAM_SIZE).map((question, index) => ({
      ...question,
      sequence: index + 1,
    })),
  };
}

async function loadExtraResources(
  userId: string,
  phaseTags: string[],
  excludeUrls: string[],
): Promise<ExtraResource[]> {
  if (phaseTags.length === 0) return [];

  const [diagnosis, courses] = await Promise.all([
    prisma.vocationalDiagnosis.findUnique({
      where: { userId },
      select: { areasSecundarias: true, tecnologiasSugeridas: true },
    }),
    prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        provider: true,
        thumbnail: true,
        externalUrl: true,
        tags: true,
        areas: true,
      },
    }),
  ]);

  return pickExtraResources(
    courses.map((course) => ({
      ...course,
      tags: asStringArray(course.tags),
      areas: asStringArray(course.areas),
    })),
    phaseTags,
    {
      technologies: asStringArray(diagnosis?.tecnologiasSugeridas),
      areasSecundarias: asStringArray(diagnosis?.areasSecundarias),
    },
    excludeUrls,
  );
}

// Complementos do banco em andamento neste processo, para duas visitas
// simultâneas não pedirem a mesma leva à IA.
const topUpsInFlight = new Set<string>();
/**
 * Teto de complementos simultâneos no processo inteiro. Com o banco maior,
 * cada fase visitada pediria sua leva ao mesmo tempo e estouraria o limite
 * do provedor; quem chega com a fila cheia só pula — a próxima visita tenta.
 */
export const MAX_BACKGROUND_TOP_UPS = 1;
/** Enunciados mandados à IA para não repetir; limita o prompt conforme o banco cresce. */
const MAX_AVOID_STATEMENTS = 30;

/**
 * Garante o banco de questões da fase. O gabarito (`correctAnswer`) nunca sai
 * daqui — a correção é sempre no servidor.
 *
 * Só a primeira prova bloqueia a pessoa: se ainda não há perguntas para uma
 * prova completa, a leva é gerada na hora. O restante do banco é completado
 * em segundo plano. `fillPool` faz o script de pré-geração esperar o banco inteiro.
 */
export async function ensurePhaseQuestions(
  lessonId: string,
  context: PhaseData,
  { fillPool = false }: { fillPool?: boolean } = {},
): Promise<PhaseQuestion[]> {
  let pool = await loadQuestions(lessonId);

  if (pool.length < PHASE_EXAM_SIZE) {
    pool = await generateBatch(lessonId, context, pool);
  }

  if (fillPool) {
    while (pool.length < PHASE_QUESTION_POOL_TARGET) {
      const before = pool.length;
      pool = await generateBatch(lessonId, context, pool);
      if (pool.length === before) break;
    }
  } else if (
    pool.length < PHASE_QUESTION_POOL_TARGET &&
    !topUpsInFlight.has(lessonId) &&
    topUpsInFlight.size < MAX_BACKGROUND_TOP_UPS
  ) {
    topUpsInFlight.add(lessonId);
    void generateBatch(lessonId, context, pool)
      .catch((error: unknown) => {
        console.warn(
          `[trail-phase] Complemento do banco da fase ${lessonId} falhou: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      })
      .finally(() => topUpsInFlight.delete(lessonId));
  }

  return pool;
}

async function generateBatch(
  lessonId: string,
  context: PhaseData,
  pool: PhaseQuestion[],
): Promise<PhaseQuestion[]> {
  let generated;
  try {
    generated = await generateQuestionsForPhase({
      ...context,
      avoidStatements: pool.slice(-MAX_AVOID_STATEMENTS).map((question) => question.statement),
    });
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

  const nextSequence = pool.reduce((max, question) => Math.max(max, question.sequence), 0) + 1;
  await prisma.trailQuestion.createMany({
    data: generated.map((question, index) => ({
      lessonId,
      statement: question.statement,
      type: "MULTIPLE_CHOICE",
      sequence: nextSequence + index,
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
    options: toExamOptions(question.options),
  }));
}
