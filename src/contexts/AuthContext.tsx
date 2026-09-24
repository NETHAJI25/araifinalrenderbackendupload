import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, AuthState } from "../types";
import { authService } from "../services/authService";

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(() => {
    const user = authService.getCurrentUser();
    setState({ user, isAuthenticated: !!user, isLoading: false });
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const user = await authService.login(email, password);
      setState({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false }));
      throw e;
    }
  };

  const register = async (data: Partial<User> & { password: string }) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const user = await authService.register(data);
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false }));
      throw e;
    }
  };

  const logout = async () => {
    await authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
