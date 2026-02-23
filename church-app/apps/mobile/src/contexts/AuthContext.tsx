import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@church-app/shared';
import { api, normalizeMember } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await tokenStorage.get();
      if (token) {
        const member = await api.getMe(token);
        const user = normalizeMember(member);
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      await tokenStorage.remove();
      await tokenStorage.removeRefresh();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }

  async function login(email: string, password: string) {
    const { accessToken, refreshToken, member } = await api.login(email, password);
    const user = normalizeMember(member);
    await tokenStorage.set(accessToken);
    await tokenStorage.setRefresh(refreshToken);
    setState({ user, token: accessToken, isLoading: false, isAuthenticated: true });
  }

  async function register(firstName: string, lastName: string, email: string, password: string) {
    const { accessToken, refreshToken, member } = await api.register(firstName, lastName, email, password);
    const user = normalizeMember(member);
    await tokenStorage.set(accessToken);
    await tokenStorage.setRefresh(refreshToken);
    setState({ user, token: accessToken, isLoading: false, isAuthenticated: true });
  }

  async function refreshUser() {
    if (!state.token) return;
    try {
      // First, fetch latest user profile
      const member = await api.getMe(state.token);
      const user = normalizeMember(member);

      // If user is now active but was pending, refresh the JWT via refresh token
      // so subsequent API calls (groups, etc.) won't get 403
      if (user.status === 'active' && state.user?.status === 'pending') {
        const storedRefresh = await tokenStorage.getRefresh();
        if (storedRefresh) {
          try {
            const { accessToken, refreshToken } = await api.refreshTokens(storedRefresh);
            await tokenStorage.set(accessToken);
            await tokenStorage.setRefresh(refreshToken);
            setState((prev) => ({ ...prev, user, token: accessToken }));
            return;
          } catch {
            // Refresh token expired/invalid — user data still updated
          }
        }
      }

      setState((prev) => ({ ...prev, user }));
    } catch {
      // silently ignore — user stays as-is
    }
  }

  async function logout() {
    setState(prev => ({ ...prev, isLoading: true }));
    await tokenStorage.remove();
    await tokenStorage.removeRefresh();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
