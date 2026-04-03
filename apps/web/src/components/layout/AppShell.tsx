'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/header';
import { MobileBottomNav, DesktopSideNav } from '@/components/navigation';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Header />
      <DesktopSideNav />
      <MobileBottomNav />
      <main className="relative pt-16 pb-16 md:pb-0 md:pl-48 min-h-screen">{children}</main>
    </>
  );
}
