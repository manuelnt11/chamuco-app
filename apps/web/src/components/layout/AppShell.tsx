'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { MobileBottomNav, DesktopSideNav } from '@/components/navigation';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { GroupInvitationsProvider } from '@/store/group-invitations';
import { TripInvitationsProvider } from '@/store/trip-invitations';
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
    <GroupInvitationsProvider>
      <TripInvitationsProvider>
        <Header />
        <DesktopSideNav />
        <MobileBottomNav />
        {/* <div className="md:pl-sidebar"><ProfileCompletionBanner /></div> */}
        <main className="relative mx-auto max-w-app pt-header-safe pb-nav-safe md:pb-0 md:pl-sidebar md:transition-[padding-left] md:duration-200 md:ease-in-out min-h-screen">
          {children}
        </main>
        <FeedbackButton />
      </TripInvitationsProvider>
    </GroupInvitationsProvider>
  );
}
