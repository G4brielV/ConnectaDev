import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, LoginCredentials } from './types';
import { tokenStorage } from '@/shared/lib/storage/tokenStorage';
import { loginRequest } from '@/features/auth/api/authService';
import { registerSessionExpiredCallback } from '@/shared/api/apiClient';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
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

  // TT-51: Atualizar estado global de autenticação após login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response = await loginRequest(credentials);
    await tokenStorage.setAccessToken(response.token);
    setToken(response.token);
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
