import { FastifyReply, FastifyRequest } from "fastify";
import { auth, ensureDevelopmentUser } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { getQuizDiagnosisService } from "../services/getQuizDiagnosis.service";

type SessionResolver = (context: {
  headers: Headers;
}) => Promise<{ user: { id: string } } | null>;

// Dependências injetáveis para permitir testes sem banco/Better Auth
export interface QuizDiagnosisControllerDeps {
  loadDiagnosis?: typeof getQuizDiagnosisService;
  getSession?: SessionResolver;
  resolveDevelopmentUser?: () => Promise<string>;
  isProduction?: () => boolean;
}

export async function getQuizDiagnosisController(
  request: FastifyRequest,
  reply: FastifyReply,
  {
    loadDiagnosis = getQuizDiagnosisService,
    getSession = ({ headers }) => auth.api.getSession({ headers }),
    resolveDevelopmentUser = ensureDevelopmentUser,
    isProduction = () => process.env.NODE_ENV === "production",
  }: QuizDiagnosisControllerDeps = {},
) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  const session = await getSession({ headers });
  if (!session && isProduction()) {
    throw new AppError("É necessário estar autenticado para consultar o diagnóstico.", 401);
  }

  const userId = session?.user.id ?? (await resolveDevelopmentUser());
  const result = await loadDiagnosis(userId);
  return reply.status(200).send(result);
}
