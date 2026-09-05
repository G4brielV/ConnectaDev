import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, LoginCredentials, RegisterCredentials } from './types';
import { tokenStorage } from '@/shared/lib/storage/tokenStorage';
import { loginRequest, registerRequest } from '@/features/auth/api/authService';
import { registerSessionExpiredCallback } from '@/shared/api/apiClient';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // TT-51: Restaurar sessão salva do Secure Storage ao inicializar
  useEffect(() => {
    async function loadStoredSession() {
      try {
        const storedToken = await tokenStorage.getAccessToken();
        if (storedToken) {
          setToken(storedToken);
          // Usuário recuperado ou placeholder até a rota /me
          setUser({ id: 'current-user', email: '' });
        }
      } catch {
        // Falha ao recuperar token
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  // TT-55: Registrar interceptor de expiração de sessão
  useEffect(() => {
    const unregister = registerSessionExpiredCallback(() => {
      setToken(null);
      setUser(null);
    });

    return () => {
      unregister();
    };
  }, []);

  // TT-51 & TT-53: Atualizar estado global de autenticação e salvar tokens após login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response = await loginRequest(credentials);
    const activeToken = response.accessToken || response.token;
    await tokenStorage.setAccessToken(activeToken);
    if (response.refreshToken) {
      await tokenStorage.setRefreshToken(response.refreshToken);
    }
    setToken(activeToken);
    setUser(response.user);
  };

  // TT-56: Atualizar estado global e salvar accessToken/refreshToken no SecureStore após cadastro
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    const response = await registerRequest(credentials);
    const activeToken = response.accessToken || response.token;
    await tokenStorage.setAccessToken(activeToken);
    if (response.refreshToken) {
      await tokenStorage.setRefreshToken(response.refreshToken);
    }
    setToken(activeToken);
    setUser(response.user);
  };

  // Logout com limpeza de tokens
  const logout = async (): Promise<void> => {
    await tokenStorage.clearTokens();
    setToken(null);
    setUser(null);
  };

  const contextValue = useMemo<AuthContextData>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
