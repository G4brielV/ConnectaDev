import { AxiosError } from 'axios';

/**
 * Padrões de expressões que indicam mensagens técnicas ou internas
 * que nunca devem ser exibidas diretamente para o usuário final.
 */
const TECHNICAL_TERMS_REGEX =
  /(json|syntax|token|payload|prisma|sql|database|internal|adapter|undefined|object|uncaught|typeerror|referenceerror|p2021|p2002|relation|column|query|stack|handler|fastify)/i;

/**
 * Mensagens amigáveis padronizadas por código de status HTTP
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Dados informados inválidos. Verifique os campos e tente novamente.',
  401: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Serviço ou recurso não encontrado.',
  409: 'Este e-mail já está em uso.',
  422: 'Não foi possível processar a requisição com os dados informados.',
  500: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  503: 'Serviço em manutenção. Tente novamente mais tarde.',
  504: 'Tempo de resposta excedido. Tente novamente.',
};

/**
 * Normaliza qualquer erro (AxiosError, Error nativo, string ou desconhecido)
 * em uma mensagem clara, segura e amigável em português.
 */
export function normalizeApiError(
  error: unknown,
  fallbackMessage = 'Ocorreu um erro ao processar sua solicitação. Tente novamente.'
): string {
  if (!error) {
    return fallbackMessage;
  }

  // Tratamento de AxiosError
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    // Erros de rede ou timeout
    if (
      !axiosError.response ||
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.code === 'ECONNABORTED' ||
      axiosError.message?.toLowerCase().includes('network')
    ) {
      return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    }

    const statusCode = axiosError.response.status;
    const rawMessage =
      axiosError.response.data?.message || axiosError.response.data?.error;

    // Se houver uma mensagem do servidor, verificar se é técnica
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
      if (!TECHNICAL_TERMS_REGEX.test(rawMessage)) {
        return rawMessage;
      }
    }

    // Se a mensagem for técnica ou inexistente, recorrer à mensagem do status code
    if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
      return HTTP_STATUS_MESSAGES[statusCode];
    }

    return fallbackMessage;
  }

  // Tratamento de Error padrão
  if (error instanceof Error) {
    // Se a mensagem contiver termos técnicos ou ingleses de erro de parser
    if (TECHNICAL_TERMS_REGEX.test(error.message)) {
      return fallbackMessage;
    }
    return error.message;
  }

  if (typeof error === 'string') {
    if (TECHNICAL_TERMS_REGEX.test(error)) {
      return fallbackMessage;
    }
    return error;
  }

  return fallbackMessage;
}
