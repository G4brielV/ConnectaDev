import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { LEVEL_NAME } from "../constants/xpLevel";
import { applyStudyActivity } from "./gamification.service";
import { getTrailMapForUser } from "./getTrailMap.service";
import { ensurePhaseQuestions, PHASE_CONTEXT_INCLUDE, toPhaseContext } from "./getTrailPhase.service";
import { ExamOption, toExamOptions } from "./phaseExam";
import {
  composePractice,
  hasPracticeSources,
  PRACTICE_MAX_XP,
  PRACTICE_XP_PER_CORRECT,
  PracticeHistory,
  practiceSources,
  practiceXp,
} from "./practiceRules";
import { studyDayToDate, toStudyDay } from "./studyDay";

const TRAIL_PRACTICE_SOURCE = "TRAIL_PRACTICE";

export interface PracticeQuestion {
  id: string;
  statement: string;
  options: ExamOption[];
  phaseTitle: string;
  /** Veio de uma fase já concluída, não da fase atual. */
  isReview: boolean;
}

export interface DailyPracticeResponse {
  sessionId: string;
  /** Ainda não houve prática com XP hoje: esta vale até `maxXp`. */
  rewardAvailable: boolean;
  xpPerCorrect: number;
  maxXp: number;
  currentPhase: { id: string; title: string } | null;
  questions: PracticeQuestion[];
}

export interface PracticeAnswerResult {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface DailyPracticeResult {
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  /** Esta foi a prática do dia que valeu XP; false = treino livre. */
  rewarded: boolean;
  totalXp: number;
  currentLevel: number;
  levelName: string;
  leveledUp: boolean;
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
}

interface PoolQuestion {
  id: string;
  statement: string;
  options: ExamOption[];
  lessonId: string;
}

/**
 * Abre uma prática do dia: 5 perguntas da fase atual e de revisão, sem o
 * gabarito — ele só sai pergunta a pergunta, depois da resposta.
 */
export async function startDailyPractice(userId: string): Promise<DailyPracticeResponse> {
  const map = await getTrailMapForUser(userId);
  const phases = map.units.flatMap((unit) => unit.phases);
  const sources = practiceSources(phases);

  if (!hasPracticeSources(sources)) {
    throw new AppError("Ainda não há fases para praticar. Descubra sua trilha no quiz vocacional.", 409);
  }

  const [currentPool, reviewPool] = await Promise.all([
    loadCurrentPool(sources.currentId),
    loadReviewPool(sources.reviewIds),
  ]);
  const history = await loadHistory(
    userId,
    [...currentPool, ...reviewPool].map((question) => question.id),
  );
  const picks = composePractice(currentPool, reviewPool, history);

  if (picks.length === 0) {
    throw new AppError(
      "As perguntas da sua fase ainda estão sendo preparadas. Tente novamente em instantes.",
      503,
    );
  }

  const session = await prisma.trailPracticeSession.create({
    data: {
      userId,
      items: {
        create: picks.map((pick, index) => ({ questionId: pick.question.id, sequence: index + 1 })),
      },
    },
    select: { id: true },
  });

  const titleById = new Map(phases.map((phase) => [phase.id, phase.title]));

  return {
    sessionId: session.id,
    rewardAvailable: map.dailyPractice.rewardAvailable,
    xpPerCorrect: PRACTICE_XP_PER_CORRECT,
    maxXp: PRACTICE_MAX_XP,
    currentPhase: sources.currentId
      ? { id: sources.currentId, title: titleById.get(sources.currentId) ?? "" }
      : null,
    questions: picks.map(({ question, isReview }) => ({
      id: question.id,
      statement: question.statement,
      options: question.options,
      phaseTitle: titleById.get(question.lessonId) ?? "",
      isReview,
    })),
  };
}

/**
 * Registra a resposta de uma pergunta e devolve a correção. Vale a primeira
 * resposta: reenviar a mesma pergunta devolve o que já foi gravado, então
 * ver o gabarito e trocar a alternativa não muda a nota.
 */
export async function answerPracticeQuestion(
  userId: string,
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
): Promise<PracticeAnswerResult> {
  const session = await prisma.trailPracticeSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      completedAt: true,
      items: {
        where: { questionId },
        select: {
          id: true,
          selectedOptionId: true,
          isCorrect: true,
          question: { select: { options: true, correctAnswer: true, explanation: true } },
        },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Prática não encontrada.", 404);
  }

  const item = session.items[0];
  if (!item) {
    throw new AppError("Esta pergunta não faz parte da prática.", 400);
  }

  const { question } = item;
  const toResult = (selected: string, isCorrect: boolean): PracticeAnswerResult => ({
    questionId,
    selectedOptionId: selected,
    correctOptionId: question.correctAnswer,
    isCorrect,
    explanation: question.explanation,
  });

  if (item.selectedOptionId !== null) {
    return toResult(item.selectedOptionId, item.isCorrect === true);
  }
  if (session.completedAt) {
    throw new AppError("Esta prática já foi finalizada.", 409);
  }
  if (!toExamOptions(question.options).some((option) => option.id === selectedOptionId)) {
    throw new AppError("Alternativa inválida para esta pergunta.", 400);
  }

  const isCorrect = selectedOptionId === question.correctAnswer;
  const { count } = await prisma.trailPracticeItem.updateMany({
    where: { id: item.id, selectedOptionId: null },
    data: { selectedOptionId, isCorrect, answeredAt: new Date() },
  });

  if (count === 0) {
    // Outra requisição respondeu primeiro; é ela que vale.
    const stored = await prisma.trailPracticeItem.findUniqueOrThrow({
      where: { id: item.id },
      select: { selectedOptionId: true, isCorrect: true },
    });
    return toResult(stored.selectedOptionId ?? selectedOptionId, stored.isCorrect === true);
  }

  return toResult(selectedOptionId, isCorrect);
}

/**
 * Fecha a prática: soma os acertos, paga o XP se for a primeira concluída no
 * dia e registra o dia de estudo na ofensiva — treino livre também conta.
 */
export async function completeDailyPractice(
  userId: string,
  sessionId: string,
  now: Date = new Date(),
): Promise<DailyPracticeResult> {
  const session = await prisma.trailPracticeSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      completedAt: true,
      items: { select: { selectedOptionId: true, isCorrect: true } },
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Prática não encontrada.", 404);
  }
  if (session.completedAt) {
    throw new AppError("Esta prática já foi finalizada.", 409);
  }
  if (session.items.some((item) => item.selectedOptionId === null)) {
    throw new AppError("Responda todas as perguntas antes de finalizar.", 400);
  }

  const correctCount = session.items.filter((item) => item.isCorrect === true).length;
  const today = studyDayToDate(toStudyDay(now));

  try {
    return await prisma.$transaction(async (transaction) => {
      const { count } = await transaction.trailPracticeSession.updateMany({
        where: { id: sessionId, completedAt: null },
        data: { completedAt: now },
      });
      if (count === 0) {
        throw new AppError("Esta prática já foi finalizada.", 409);
      }

      const rewardedToday = await transaction.trailPracticeSession.findFirst({
        where: { userId, rewardedDay: today },
        select: { id: true },
      });
      const rewarded = rewardedToday === null;
      const xpEarned = practiceXp(correctCount, rewarded);

      // O unique (userId, rewardedDay) segura dois envios simultâneos no mesmo dia.
      await transaction.trailPracticeSession.update({
        where: { id: sessionId },
        data: { correctCount, xpEarned, rewardedDay: rewarded ? today : null },
      });

      if (xpEarned > 0) {
        await transaction.xpEvent.create({
          data: {
            userId,
            source: TRAIL_PRACTICE_SOURCE,
            referenceId: sessionId,
            amount: xpEarned,
          },
        });
      }

      const activity = await applyStudyActivity(transaction, userId, xpEarned, now);

      return {
        correctCount,
        totalQuestions: session.items.length,
        xpEarned,
        rewarded,
        totalXp: activity.totalXp,
        currentLevel: activity.currentLevel,
        levelName: LEVEL_NAME,
        leveledUp: activity.currentLevel > activity.previousLevel,
        currentStreak: activity.currentStreak,
        longestStreak: activity.longestStreak,
        streakIncremented: activity.streakIncremented,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // A transação voltou atrás; na nova tentativa esta sessão vira treino livre.
      throw new AppError("Outra prática acabou de ser finalizada. Tente novamente.", 409);
    }
    throw error;
  }
}

async function loadCurrentPool(lessonId: string | null): Promise<PoolQuestion[]> {
  if (!lessonId) return [];

  const lesson = await prisma.trailLesson.findFirst({
    where: { id: lessonId, isActive: true },
    include: PHASE_CONTEXT_INCLUDE,
  });
  if (!lesson) return [];

  try {
    const pool = await ensurePhaseQuestions(lesson.id, toPhaseContext(lesson));
    return pool.map((question) => ({
      id: question.id,
      statement: question.statement,
      options: question.options,
      lessonId: lesson.id,
    }));
  } catch (error) {
    // Banco da fase atual ainda vazio e a IA fora do ar: a revisão segura a prática.
    if (error instanceof AppError && error.statusCode === 503) return [];
    throw error;
  }
}

async function loadReviewPool(lessonIds: string[]): Promise<PoolQuestion[]> {
  if (lessonIds.length === 0) return [];

  const questions = await prisma.trailQuestion.findMany({
    where: { lessonId: { in: lessonIds }, isActive: true },
    select: { id: true, statement: true, options: true, lessonId: true },
  });

  return questions.map((question) => ({
    ...question,
    options: toExamOptions(question.options),
  }));
}

async function loadHistory(userId: string, questionIds: string[]): Promise<PracticeHistory> {
  if (questionIds.length === 0) return new Map();

  const answered = await prisma.trailPracticeItem.findMany({
    where: { questionId: { in: questionIds }, answeredAt: { not: null }, session: { userId } },
    orderBy: { answeredAt: "asc" },
    select: { questionId: true, isCorrect: true },
  });

  // Em ordem cronológica: a resposta mais recente de cada pergunta prevalece.
  return new Map(answered.map((item) => [item.questionId, item.isCorrect === true]));
}
