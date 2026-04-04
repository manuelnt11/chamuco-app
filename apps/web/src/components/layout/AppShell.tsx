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
      <main className="relative pt-header pb-header md:pb-0 md:pl-sidebar min-h-screen">
        {children}
      </main>
    </>
  );
}
