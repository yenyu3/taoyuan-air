'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type DemoRole = 'public' | 'citizen' | 'government';
export type LoginRole = Exclude<DemoRole, 'public'>;

const STORAGE_KEY = 'taoyuan-air:demo-session';

interface LoginButtonContextValue {
  role: DemoRole;
  isAuthenticated: boolean;
  /** false until the persisted role has been read from storage after mount */
  hydrated: boolean;
  login: (role: LoginRole) => void;
  logout: () => void;
}

const LoginButtonContext = createContext<LoginButtonContextValue | null>(null);

const isLoginRole = (value: unknown): value is LoginRole =>
  value === 'citizen' || value === 'government';

export function LoginButtonProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DemoRole>('public');
  const [hydrated, setHydrated] = useState(false);

  // Restore the demo session after mount so a refresh / deep link keeps
  // role-specific pages reachable without causing hydration drift.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let nextRole: DemoRole = 'public';

      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as {
          role?: unknown;
        } | null;
        if (isLoginRole(stored?.role)) nextRole = stored.role;
      } catch {
        /* localStorage unavailable */
      }

      setRole(nextRole);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const login = useCallback((nextRole: LoginRole) => {
    setRole(nextRole);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ role: nextRole, loggedInAt: new Date().toISOString() }),
      );
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const logout = useCallback(() => {
    setRole('public');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const isAuthenticated = role !== 'public';

  return (
    <LoginButtonContext.Provider
      value={{
        role,
        isAuthenticated,
        hydrated,
        login,
        logout,
      }}
    >
      {children}
    </LoginButtonContext.Provider>
  );
}

export function useLoginButton() {
  const ctx = useContext(LoginButtonContext);
  if (!ctx) throw new Error('useLoginButton must be used inside LoginButtonProvider');
  return ctx;
}
