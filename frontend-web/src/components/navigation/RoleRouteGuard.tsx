'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type DemoRole, useLoginButton } from '@/lib/login-button-context';

const PUBLIC_PATHS = new Set(['/', '/dashboard', '/map', '/explorer']);
const AUTHENTICATED_PATHS = new Set(['/alerts', '/notifications', '/settings']);
const GOVERNMENT_PATHS = new Set(['/events']);
const KNOWN_ROUTES = new Set([...PUBLIC_PATHS, ...AUTHENTICATED_PATHS, ...GOVERNMENT_PATHS]);

/** Whether `role` may view `pathname`. Unknown paths (404s) are left to Next.js. */
function isPathAllowed(pathname: string, role: DemoRole): boolean {
  if (!KNOWN_ROUTES.has(pathname)) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (role === 'public') return false;
  if (AUTHENTICATED_PATHS.has(pathname)) return true;
  if (GOVERNMENT_PATHS.has(pathname)) return role === 'government';
  return false;
}

export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, hydrated } = useLoginButton();
  const allowed = isPathAllowed(pathname, role);

  useEffect(() => {
    if (!hydrated || allowed) return;
    router.replace('/dashboard');
  }, [hydrated, allowed, router]);

  // The persisted role is only known after hydration. Public paths render
  // straight away; role-gated paths stay blank until then so an unauthorised
  // visitor never sees a flash of protected content before the redirect.
  if (!PUBLIC_PATHS.has(pathname) && (!hydrated || !allowed)) return null;

  return <>{children}</>;
}
