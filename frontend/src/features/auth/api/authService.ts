import { AxiosError } from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { AuthResponse, LoginCredentials } from '@/entities/session/model/types';

export class AuthError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/api/auth/sign-in/email', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const data = response.data;

    // Extrai o token e usuário da resposta do Better Auth
    const token =
      data?.token ||
      data?.accessToken ||
      data?.session?.token ||
      (typeof data === 'string' ? data : null);

    const refreshToken = data?.refreshToken || data?.session?.token || token;

    const user = data?.user || {
      id: data?.id || 'unknown',
      email: credentials.email.trim(),
      name: data?.name,
    };

    if (!token) {
      throw new AuthError('Token de autenticação não foi retornado pelo servidor.');
    }

    return { token, accessToken: token, refreshToken, user };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    // TT-54: Tratar erro 401 no login com mensagem amigável
    if (axiosError.response?.status === 401) {
      throw new AuthError(
        'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
        401
      );
    }

    if (axiosError.response?.status === 400) {
      const serverMsg = axiosError.response.data?.message;
      throw new AuthError(
        serverMsg || 'Dados de login inválidos. Verifique os campos.',
        400
      );
    }

    if (!axiosError.response) {
      throw new AuthError(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      );
    }

    throw new AuthError(
      'Ocorreu um erro ao realizar o login. Tente novamente mais tarde.',
      axiosError.response.status
    );
  }
}

// TT-56 a TT-61: Serviço de requisição de cadastro
export async function registerRequest(credentials: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/register', {
      name: credentials.name.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const data = response.data;

    const token =
      data?.token ||
      data?.accessToken ||
      data?.session?.token ||
      (typeof data === 'string' ? data : null);

    const refreshToken = data?.refreshToken || data?.session?.token || token;

    const user = data?.user || {
      id: data?.id || 'new-user',
      email: credentials.email.trim(),
      name: credentials.name.trim(),
    };

    if (!token) {
      throw new AuthError('Token de autenticação não foi retornado pelo servidor.');
    }

    return { token, accessToken: token, refreshToken, user };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    const axiosError = error as AxiosError<{ message?: string; error?: string; code?: string }>;

    // TT-59 / Cenário 4: Conflito de e-mail já existente (HTTP 409)
    if (axiosError.response?.status === 409) {
      throw new AuthError(
        'Este e-mail já está em uso',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    if (axiosError.response?.status === 400) {
      const serverMsg = axiosError.response.data?.message;
      throw new AuthError(
        serverMsg || 'Dados de cadastro inválidos. Verifique os campos.',
        400
      );
    }

    // TT-61 / Cenário 6: Falha de conexão de rede ou timeout rápido
    if (
      !axiosError.response ||
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.code === 'ECONNABORTED' ||
      axiosError.message?.toLowerCase().includes('network')
    ) {
      throw new AuthError(
        'Sem conexão com a internet. Verifique sua rede e tente novamente',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new AuthError(
      'Ocorreu um erro ao realizar o cadastro. Tente novamente mais tarde.',
      axiosError.response.status
    );
  }
}
