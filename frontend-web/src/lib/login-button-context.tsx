'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type DemoRole = 'public' | 'government';

const STORAGE_KEY = 'taoyuan-air:demo-role-active';

interface LoginButtonContextValue {
  isLoginButtonActive: boolean;
  role: DemoRole;
  /** false until the persisted role has been read from storage after mount */
  hydrated: boolean;
  toggleLoginButton: () => void;
}

const LoginButtonContext = createContext<LoginButtonContextValue | null>(null);

export function LoginButtonProvider({ children }: { children: React.ReactNode }) {
  const [isLoginButtonActive, setIsLoginButtonActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore the demo role after mount so a refresh / deep link keeps the
  // government-only pages (/explorer, /events) reachable.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let active = false;

      try {
        active = window.localStorage.getItem(STORAGE_KEY) === '1';
      } catch {
        /* localStorage unavailable */
      }

      setIsLoginButtonActive(active);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const toggleLoginButton = useCallback(() => {
    setIsLoginButtonActive((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* localStorage unavailable */
      }
      return next;
    });
  }, []);

  return (
    <LoginButtonContext.Provider
      value={{
        isLoginButtonActive,
        role: isLoginButtonActive ? 'government' : 'public',
        hydrated,
        toggleLoginButton,
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
