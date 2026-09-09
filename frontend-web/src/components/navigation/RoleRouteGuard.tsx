'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginButton } from '@/lib/login-button-context';

const PUBLIC_PATHS = new Set(['/', '/dashboard', '/map', '/explorer', '/alerts', '/notifications', '/settings']);

export function RoleRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, hydrated } = useLoginButton();

  useEffect(() => {
    if (!hydrated) return;
    if (role === 'public' && !PUBLIC_PATHS.has(pathname)) {
      router.replace('/dashboard');
    }
  }, [hydrated, pathname, role, router]);

  return null;
}
