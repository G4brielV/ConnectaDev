import { prisma } from "../../../lib/auth";
import {
  QuizOption,
  QuizQuestion,
  QuizQuestionType,
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
    },
  });

  return questions.map((question) => ({
    id: question.id,
    statement: question.statement,
    type: question.type as QuizQuestionType,
    sequence: question.sequence,
    isActive: question.isActive,
    ...(parseOptions(question.options) && {
      options: parseOptions(question.options),
    }),
  }));
}
