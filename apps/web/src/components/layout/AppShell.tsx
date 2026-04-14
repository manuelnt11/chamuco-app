'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { MobileBottomNav, DesktopSideNav } from '@/components/navigation';

// Auth pages and public legal pages render without nav chrome
const AUTH_PATHS = ['/sign-in', '/onboarding', '/privacy-policy', '/terms-of-service'];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (AUTH_PATHS.includes(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <DesktopSideNav />
      <MobileBottomNav />
      <main className="relative pt-header pb-header md:pb-0 md:pl-sidebar min-h-screen">
        {children}
      </main>
    </>
  );
}
