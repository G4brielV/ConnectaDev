import { prisma } from "../../../lib/auth";
import { hasPracticeSources, PRACTICE_MAX_XP, practiceSources } from "./practiceRules";
import { studyDayToDate, toStudyDay } from "./studyDay";
import {
  EMPTY_PROGRESS,
  isTrailFinished,
  PhaseProgress,
  PhaseStatus,
  resolvePhaseStates,
} from "./trailMapRules";

export interface TrailMapResource {
  id: string;
  title: string;
  url: string;
  kind: string;
  courseId: string | null;
  thumbnail: string | null;
}

export interface TrailMapPhase {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  kind: string;
  xpReward: number;
  passingScore: number;
  status: PhaseStatus;
  unlocked: boolean;
  stars: number;
  bestPercentage: number;
  attempts: number;
  resourceCount: number;
}

export interface TrailMapUnit {
  id: string;
  title: string;
  sequence: number;
  phases: TrailMapPhase[];
  completedPhases: number;
  totalPhases: number;
  progressPercentage: number;
}

export interface DailyPracticeStatus {
  /** Há fase atual ou concluída para tirar perguntas. */
  available: boolean;
  /** A prática com XP de hoje ainda não foi feita. */
  rewardAvailable: boolean;
  maxXp: number;
}

export interface TrailMapResponse {
  hasDiagnosis: boolean;
  area: string | null;
  trail: { id: string; title: string; description: string | null } | null;
  units: TrailMapUnit[];
  currentPhaseId: string | null;
  completedPhases: number;
  totalPhases: number;
  finished: boolean;
  dailyPractice: DailyPracticeStatus;
}

const EMPTY_MAP: TrailMapResponse = {
  hasDiagnosis: false,
  area: null,
  trail: null,
  units: [],
  currentPhaseId: null,
  completedPhases: 0,
  totalPhases: 0,
  finished: false,
  dailyPractice: { available: false, rewardAvailable: false, maxXp: PRACTICE_MAX_XP },
};

export async function getTrailMapForUser(userId: string): Promise<TrailMapResponse> {
  const diagnosis = await prisma.vocationalDiagnosis.findUnique({
    where: { userId },
    select: { areaPrincipal: true },
  });

  if (!diagnosis) return EMPTY_MAP;

  const [trail, rewardedToday] = await Promise.all([
    prisma.trail.findFirst({
      where: { isActive: true, area: diagnosis.areaPrincipal, units: { some: { isActive: true } } },
      orderBy: { createdAt: "asc" },
      include: {
        units: {
          where: { isActive: true },
          orderBy: { sequence: "asc" },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { sequence: "asc" },
              include: {
                _count: { select: { resources: true } },
                userProgress: { where: { userId }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.trailPracticeSession.findFirst({
      where: { userId, rewardedDay: studyDayToDate(toStudyDay(new Date())) },
      select: { id: true },
    }),
  ]);

  if (!trail) {
    return { ...EMPTY_MAP, hasDiagnosis: true, area: diagnosis.areaPrincipal };
  }

  // O gate é sequencial na trilha inteira, então as fases de todas as
  // unidades entram numa lista só antes de resolver os estados.
  const flatPhases = trail.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      id: lesson.id,
      sequence: lesson.sequence,
      kind: lesson.kind,
      progress: toProgress(lesson.userProgress[0]),
    })),
  );

  const states = resolvePhaseStates(flatPhases);
  const stateById = new Map(states.map((state) => [state.id, state]));

  const units = trail.units.map((unit): TrailMapUnit => {
    const phases = unit.lessons.map((lesson): TrailMapPhase => {
      const state = stateById.get(lesson.id);
      const progress = toProgress(lesson.userProgress[0]) ?? EMPTY_PROGRESS;

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        sequence: lesson.sequence,
        kind: lesson.kind,
        xpReward: lesson.xpReward,
        passingScore: lesson.passingScore,
        status: state?.status ?? "locked",
        unlocked: state?.unlocked ?? false,
        stars: progress.stars,
        bestPercentage: progress.bestPercentage,
        attempts: progress.attempts,
        resourceCount: lesson._count.resources,
      };
    });

    const completedPhases = phases.filter((phase) => phase.status === "completed").length;

    return {
      id: unit.id,
      title: unit.title,
      sequence: unit.sequence,
      phases,
      completedPhases,
      totalPhases: phases.length,
      progressPercentage:
        phases.length === 0 ? 0 : Math.round((completedPhases / phases.length) * 100),
    };
  });

  const allPhases = units.flatMap((unit) => unit.phases);
  const completedPhases = allPhases.filter((phase) => phase.status === "completed").length;

  return {
    hasDiagnosis: true,
    area: diagnosis.areaPrincipal,
    trail: { id: trail.id, title: trail.title, description: trail.description },
    units,
    currentPhaseId: allPhases.find((phase) => phase.status === "current")?.id ?? null,
    completedPhases,
    totalPhases: allPhases.length,
    finished: isTrailFinished(states),
    dailyPractice: {
      available: hasPracticeSources(practiceSources(states)),
      rewardAvailable: rewardedToday === null,
      maxXp: PRACTICE_MAX_XP,
    },
  };
}

function toProgress(
  record: { passed: boolean; stars: number; bestPercentage: number; attempts: number } | undefined,
): PhaseProgress | null {
  if (!record) return null;
  return {
    passed: record.passed,
    stars: record.stars,
    bestPercentage: record.bestPercentage,
    attempts: record.attempts,
  };
}

/** Fases da trilha em ordem, com o progresso do usuário — base do gate. */
export async function loadPhaseGate(userId: string, lessonId: string) {
  const lesson = await prisma.trailLesson.findFirst({
    where: { id: lessonId, isActive: true, trail: { isActive: true } },
    select: { id: true, trailId: true },
  });

  if (!lesson) return null;

  const siblings = await prisma.trailLesson.findMany({
    where: { trailId: lesson.trailId, isActive: true },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      sequence: true,
      kind: true,
      userProgress: { where: { userId }, take: 1 },
    },
  });

  return siblings.map((sibling) => ({
    id: sibling.id,
    sequence: sibling.sequence,
    kind: sibling.kind,
    progress: toProgress(sibling.userProgress[0]),
  }));
}
