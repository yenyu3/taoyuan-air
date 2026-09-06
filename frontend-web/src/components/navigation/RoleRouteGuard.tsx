'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginButton } from '@/lib/login-button-context';

const PUBLIC_PATHS = new Set(['/', '/dashboard', '/map', '/alerts', '/notifications', '/settings']);

export function RoleRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useLoginButton();

  useEffect(() => {
    if (role === 'public' && !PUBLIC_PATHS.has(pathname)) {
      router.replace('/dashboard');
    }
  }, [pathname, role, router]);

  return null;
}
