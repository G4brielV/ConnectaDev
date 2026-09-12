import { prisma } from "../../../lib/auth";
import {
  QuizOption,
  QuizQuestion,
  QuizQuestionType,
  QuizValidation,
} from "../schemas/quiz.schemas";

function parseOptions(value: unknown): QuizOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const options = value.filter(
    (option): option is { id: string; label: string } =>
      typeof option === "object" &&
      option !== null &&
      "id" in option &&
      "label" in option &&
      typeof option.id === "string" &&
      typeof option.label === "string",
  );

  return options.length > 0 ? options : undefined;
}

function normalizeType(value: string): QuizQuestionType {
  if (value === "MULTIPLE_CHOICE" || value === "multiple-choice") {
    return "MULTIPLE_CHOICE";
  }

  return "OPEN_TEXT";
}

function parseValidation(value: unknown): QuizValidation | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const minLength =
    typeof record.minLength === "number" && record.minLength >= 0
      ? record.minLength
      : undefined;
  const maxLength =
    typeof record.maxLength === "number" && record.maxLength >= 0
      ? record.maxLength
      : undefined;

  return minLength !== undefined || maxLength !== undefined
    ? { minLength, maxLength }
    : undefined;
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const questions = await prisma.quizQuestion.findMany({
    where: { isActive: true },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      statement: true,
      type: true,
      sequence: true,
      isActive: true,
      options: true,
      validation: true,
    },
  });

  return questions.map((question) => ({
    id: question.id,
    statement: question.statement,
    type: normalizeType(question.type),
    sequence: question.sequence,
    isActive: question.isActive,
    ...(parseOptions(question.options) && {
      options: parseOptions(question.options),
    }),
    ...(parseValidation(question.validation) && {
      validation: parseValidation(question.validation),
    }),
  }));
}
