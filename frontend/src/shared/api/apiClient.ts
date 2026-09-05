import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../lib/storage/tokenStorage';

// URL base da API (pode ser configurada via .env no Expo com EXPO_PUBLIC_API_URL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Listener para expiração de sessão (TT-55)
type SessionExpiredCallback = () => void;
let onSessionExpiredListener: SessionExpiredCallback | null = null;

export function registerSessionExpiredCallback(callback: SessionExpiredCallback): () => void {
  onSessionExpiredListener = callback;
  return () => {
    onSessionExpiredListener = null;
  };
}

// Request Interceptor: injeta o Bearer token automaticamente (TT-55)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Se falhar ao ler o token, segue a requisição sem o header
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: trata 401 e expiração de sessão (TT-55)
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/sign-in');

    // Se receber 401 em rotas autenticadas (não na tentativa de login), a sessão expirou
    if (error.response?.status === 401 && !isAuthRoute) {
      await tokenStorage.clearTokens();
      if (onSessionExpiredListener) {
        onSessionExpiredListener();
      }
    }

    return Promise.reject(error);
  }
);
