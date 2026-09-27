/** Perguntas servidas em cada tentativa da prova de uma fase. */
export const PHASE_EXAM_SIZE = 10;
/**
 * Tamanho do banco de questões por fase. Com o dobro do tamanho da prova,
 * cada tentativa sorteia um conjunto diferente — ver a correção no resultado
 * não vira gabarito decorado para a próxima.
 */
export const PHASE_QUESTION_POOL_TARGET = 20;

export type RandomSource = () => number;

export interface ExamOption {
  id: string;
  label: string;
}

export interface ExamQuestion {
  id: string;
  statement: string;
  options: ExamOption[];
}

export interface GradableQuestion extends ExamQuestion {
  correctAnswer: string;
  explanation: string | null;
}

export interface ExamReviewItem {
  questionId: string;
  statement: string;
  options: ExamOption[];
  /** null quando a pergunta ficou em branco (só acontece nas lições antigas). */
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface ExamGrade {
  correctCount: number;
  totalQuestions: number;
  review: ExamReviewItem[];
}

export class InvalidExamAnswersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExamAnswersError";
  }
}

/** Fisher-Yates sem mutar a entrada; `random` é injetável para os testes. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Sorteia a prova de uma tentativa: um subconjunto do banco, em ordem
 * aleatória, com as alternativas embaralhadas. Os ids das alternativas não
 * mudam — a correção continua sendo pelo id, e a letra exibida é a posição.
 */
export function drawExam<Q extends ExamQuestion>(
  pool: readonly Q[],
  size: number = PHASE_EXAM_SIZE,
  random: RandomSource = Math.random,
): Q[] {
  return shuffle(pool, random)
    .slice(0, size)
    .map((question) => ({ ...question, options: shuffle(question.options, random) }));
}

export function examSizeFor(poolSize: number): number {
  return Math.min(PHASE_EXAM_SIZE, poolSize);
}

function reviewItem(question: GradableQuestion, selected: string | null): ExamReviewItem {
  return {
    questionId: question.id,
    statement: question.statement,
    options: question.options,
    selectedOptionId: selected,
    correctOptionId: question.correctAnswer,
    isCorrect: selected === question.correctAnswer,
    explanation: question.explanation,
  };
}

function summarize(review: ExamReviewItem[]): ExamGrade {
  return {
    correctCount: review.filter((item) => item.isCorrect).length,
    totalQuestions: review.length,
    review,
  };
}

/**
 * Corrige a prova de uma fase do mapa. Como cada tentativa sorteia perguntas
 * do banco, a nota é sobre as perguntas respondidas — que precisam ser
 * exatamente uma prova completa, todas do banco desta fase. Responder menos
 * (ou escolher só as que já sabe) não é aceito.
 */
export function gradePhaseExam(
  pool: readonly GradableQuestion[],
  answers: Record<string, string>,
): ExamGrade {
  const byId = new Map(pool.map((question) => [question.id, question]));
  const answeredIds = Object.keys(answers);
  const expected = examSizeFor(pool.length);

  if (answeredIds.some((questionId) => !byId.has(questionId))) {
    throw new InvalidExamAnswersError("As respostas não correspondem à prova desta fase.");
  }
  if (answeredIds.length !== expected) {
    throw new InvalidExamAnswersError(
      `Responda as ${expected} perguntas da prova antes de enviar.`,
    );
  }

  return summarize(
    answeredIds.map((questionId) => reviewItem(byId.get(questionId)!, answers[questionId])),
  );
}

/** Lições antigas (sem unidade) mantêm a regra de sempre: todas as perguntas contam. */
export function gradeFullLesson(
  questions: readonly GradableQuestion[],
  answers: Record<string, string>,
): ExamGrade {
  return summarize(
    questions.map((question) => reviewItem(question, answers[question.id] ?? null)),
  );
}

export function toExamOptions(value: unknown): ExamOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (option): option is ExamOption =>
      typeof option === "object" &&
      option !== null &&
      typeof (option as ExamOption).id === "string" &&
      typeof (option as ExamOption).label === "string",
  );
}
