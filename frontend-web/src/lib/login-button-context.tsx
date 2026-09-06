'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type DemoRole = 'public' | 'government';

interface LoginButtonContextValue {
  isLoginButtonActive: boolean;
  role: DemoRole;
  toggleLoginButton: () => void;
}

const LoginButtonContext = createContext<LoginButtonContextValue | null>(null);

export function LoginButtonProvider({ children }: { children: React.ReactNode }) {
  const [isLoginButtonActive, setIsLoginButtonActive] = useState(false);

  const toggleLoginButton = useCallback(() => {
    setIsLoginButtonActive((current) => !current);
  }, []);

  return (
    <LoginButtonContext.Provider
      value={{
        isLoginButtonActive,
        role: isLoginButtonActive ? 'government' : 'public',
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
