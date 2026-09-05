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

// Fila de requisições pendentes durante a renovação de token (TT-55)
interface FailedRequestQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequestQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: renovação automática de token e expiração de sessão (TT-55)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const requestUrl = originalRequest?.url || '';
    const isAuthRoute =
      requestUrl.includes('/sign-in') ||
      requestUrl.includes('/sign-up') ||
      requestUrl.includes('/register') ||
      requestUrl.includes('/logout') ||
      requestUrl.includes('/sign-out') ||
      requestUrl.includes('/refresh-token');

    // Se receber 401 em rotas de login/cadastro ou sem configuração, propaga o erro
    if (error.response?.status !== 401 || isAuthRoute || !originalRequest) {
      return Promise.reject(error);
    }

    // Se já tentou renovar e falhou, encerra a sessão imediatamente
    if (originalRequest._retry) {
      await tokenStorage.clearTokens();
      if (onSessionExpiredListener) {
        onSessionExpiredListener();
      }
      return Promise.reject(error);
    }

    // Se outra requisição já estiver renovando o token, enfileira a requisição atual
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Nenhum refresh token disponível');
      }

      // Executa chamada direta sem passar pelo interceptor do apiClient para evitar recursão
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/api/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
          timeout: 7000,
        }
      );

      const data = refreshResponse.data as any;
      const newAccessToken =
        data?.token || data?.accessToken || data?.session?.token;
      const newRefreshToken = data?.refreshToken || data?.session?.token;

      if (!newAccessToken) {
        throw new Error('Novo token não retornado pelo servidor');
      }

      await tokenStorage.setAccessToken(newAccessToken);
      if (newRefreshToken) {
        await tokenStorage.setRefreshToken(newRefreshToken);
      }

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await tokenStorage.clearTokens();
      if (onSessionExpiredListener) {
        onSessionExpiredListener();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
