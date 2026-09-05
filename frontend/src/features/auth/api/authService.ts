import { AxiosError } from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { AuthResponse, LoginCredentials } from '@/entities/session/model/types';

export class AuthError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const data = response.data;

    // Extrai o token e usuário da resposta do Better Auth
    const token =
      data?.token ||
      data?.session?.token ||
      (typeof data === 'string' ? data : null);

    const user = data?.user || {
      id: data?.id || 'unknown',
      email: credentials.email,
      name: data?.name,
    };

    if (!token) {
      throw new AuthError('Token de autenticação não foi retornado pelo servidor.');
    }

    return { token, user };
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
