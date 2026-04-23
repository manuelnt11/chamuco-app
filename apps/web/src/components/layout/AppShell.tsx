'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { MobileBottomNav, DesktopSideNav } from '@/components/navigation';
// TODO: re-enable once notifications/banners are fully designed
// import { ProfileCompletionBanner } from '@/components/ProfileCompletionBanner';

// Pages that render without nav chrome (auth flows + public legal pages)
const NO_CHROME_PATHS = [
  '/sign-in',
  '/onboarding',
  '/privacy-policy',
  '/terms-of-service',
  '/account-deletion',
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (NO_CHROME_PATHS.includes(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <DesktopSideNav />
      <MobileBottomNav />
      {/* <div className="md:pl-sidebar"><ProfileCompletionBanner /></div> */}
      <main className="relative pt-header pb-header md:pb-0 md:pl-sidebar min-h-screen">
        {children}
      </main>
    </>
  );
}
