import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { QuizSubmitRequest } from "../schemas/quiz.schemas";
import {
  AiGatewayTimeoutError,
  AiGatewayRequestError,
  submitQuiz,
} from "../services/submitQuiz.service";
import { ensureDevelopmentUser, prisma } from "../../../lib/auth";

type QuizAnalysisResult = Awaited<ReturnType<typeof submitQuiz>>;

type SessionResolver = (context: {
  headers: Headers;
}) => Promise<{ user: { id: string } } | null>;

// Dependências injetáveis para permitir testes sem banco/Better Auth
export interface SubmitQuizControllerDeps {
  analyzeQuiz?: typeof submitQuiz;
  getSession?: SessionResolver;
  resolveDevelopmentUser?: () => Promise<string>;
  isProduction?: () => boolean;
  saveDiagnosis?: (userId: string, result: QuizAnalysisResult) => Promise<void>;
}

const defaultSaveDiagnosis = async (
  userId: string,
  result: QuizAnalysisResult,
): Promise<void> => {
  await prisma.vocationalDiagnosis.upsert({
    where: { userId },
    create: {
      userId,
      areaPrincipal: result.areaPrincipal,
      tecnologiasSugeridas: result.tecnologiasSugeridas,
    },
    update: {
      areaPrincipal: result.areaPrincipal,
      tecnologiasSugeridas: result.tecnologiasSugeridas,
    },
  });
};

export async function submitQuizController(
  request: FastifyRequest<{ Body: QuizSubmitRequest }>,
  reply: FastifyReply,
  {
    analyzeQuiz = submitQuiz,
    getSession = ({ headers }) => auth.api.getSession({ headers }),
    resolveDevelopmentUser = ensureDevelopmentUser,
    isProduction = () => process.env.NODE_ENV === "production",
    saveDiagnosis = defaultSaveDiagnosis,
  }: SubmitQuizControllerDeps = {},
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  // A sessão é sempre resolvida: o diagnóstico precisa ser gravado no mesmo
  // usuário que getQuizDiagnosis consulta, senão o onboarding do quiz reabre
  // a cada login. O usuário de desenvolvimento é só o fallback sem sessão.
  const session = await getSession({ headers });

  if (!session && isProduction()) {
    throw new AppError("É necessário estar autenticado para enviar o quiz.", 401);
  }

  const payload = request.body;
  if (!payload || !payload.answers || typeof payload.answers !== "object") {
    throw new AppError("As respostas do quiz são obrigatórias.", 400);
  }

  try {
    const userId = session?.user.id ?? (await resolveDevelopmentUser());
    const result = await analyzeQuiz(payload, userId);
    await saveDiagnosis(userId, result);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AiGatewayTimeoutError) {
      throw new AppError(error.message, 504);
    }

    if (error instanceof AiGatewayRequestError) {
      throw new AppError(
        `Não foi possível processar o perfil pela IA: ${error.message}`,
        502,
      );
    }

    throw new AppError(
      error instanceof Error
        ? error.message
        : "Não foi possível processar o perfil pela IA.",
      502,
    );
  }
}
