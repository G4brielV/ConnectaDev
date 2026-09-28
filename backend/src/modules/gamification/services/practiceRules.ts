import { ExamOption, RandomSource, shuffle } from "./phaseExam";

/** Perguntas por prática do dia — curta de propósito, é o hábito diário. */
export const PRACTICE_SIZE = 5;
/** Quantas saem da fase atual; o resto é revisão das fases concluídas. */
export const PRACTICE_CURRENT_SHARE = 3;
export const PRACTICE_XP_PER_CORRECT = 2;
export const PRACTICE_MAX_XP = PRACTICE_SIZE * PRACTICE_XP_PER_CORRECT;

export interface PracticeSources {
  currentId: string | null;
  reviewIds: string[];
}

/**
 * Fases que alimentam a prática: a atual do mapa e as já vencidas. Fase
 * travada nunca entra — o gate vale aqui também.
 */
export function practiceSources(
  phases: ReadonlyArray<{ id: string; status: string }>,
): PracticeSources {
  return {
    currentId: phases.find((phase) => phase.status === "current")?.id ?? null,
    reviewIds: phases.filter((phase) => phase.status === "completed").map((phase) => phase.id),
  };
}

export function hasPracticeSources(sources: PracticeSources): boolean {
  return sources.currentId !== null || sources.reviewIds.length > 0;
}

export interface PracticeCandidate {
  id: string;
  options: ExamOption[];
}

/** Última resposta da pessoa a cada pergunta já vista na prática: acertou ou não. */
export type PracticeHistory = ReadonlyMap<string, boolean>;

/** Nunca vista primeiro, depois a que errou, por último a que já acertou. */
function priority(history: PracticeHistory, questionId: string): number {
  const lastCorrect = history.get(questionId);
  if (lastCorrect === undefined) return 0;
  return lastCorrect ? 2 : 1;
}

/** Ordena o banco pela prioridade, com sorteio dentro de cada grupo. */
export function prioritize<Q extends PracticeCandidate>(
  pool: readonly Q[],
  history: PracticeHistory,
  random: RandomSource = Math.random,
): Q[] {
  // O sort é estável: o embaralhamento prévio vira o desempate aleatório.
  return shuffle(pool, random).sort(
    (left, right) => priority(history, left.id) - priority(history, right.id),
  );
}

export interface PracticePick<Q> {
  question: Q;
  isReview: boolean;
}

/**
 * Monta a prática: até 3 da fase atual e o resto da revisão; se a revisão
 * não der conta (ninguém concluiu nada ainda), a fase atual completa. Quem
 * já terminou a trilha pratica só revisão. A ordem final e as alternativas
 * saem embaralhadas, mantendo os ids — a correção é pelo id.
 */
export function composePractice<Q extends PracticeCandidate>(
  currentPool: readonly Q[],
  reviewPool: readonly Q[],
  history: PracticeHistory = new Map(),
  random: RandomSource = Math.random,
): PracticePick<Q>[] {
  const current = prioritize(currentPool, history, random);
  const review = prioritize(reviewPool, history, random);

  const fromCurrent = current.slice(0, PRACTICE_CURRENT_SHARE);
  const fromReview = review.slice(0, PRACTICE_SIZE - fromCurrent.length);
  const missing = PRACTICE_SIZE - fromCurrent.length - fromReview.length;
  const refill = current.slice(fromCurrent.length, fromCurrent.length + missing);

  const picks: PracticePick<Q>[] = [
    ...[...fromCurrent, ...refill].map((question) => ({ question, isReview: false })),
    ...fromReview.map((question) => ({ question, isReview: true })),
  ];

  return shuffle(picks, random).map((pick) => ({
    ...pick,
    question: { ...pick.question, options: shuffle(pick.question.options, random) },
  }));
}

/** Só a primeira prática concluída no dia vale XP; as outras são treino livre. */
export function practiceXp(correctCount: number, rewarded: boolean): number {
  return rewarded ? correctCount * PRACTICE_XP_PER_CORRECT : 0;
}
