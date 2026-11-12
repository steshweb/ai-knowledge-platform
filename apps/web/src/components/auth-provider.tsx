'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, ApiError } from '../lib/api-client';
import type { User } from '../lib/api-client';

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .refresh()
      .then((result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      })
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error(error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      async login(email, password) {
        const result = await apiClient.login(email, password);
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      async register(email, password) {
        const result = await apiClient.register(email, password);
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      async logout() {
        await apiClient.logout();
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
