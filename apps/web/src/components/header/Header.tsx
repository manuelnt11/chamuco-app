'use client';

import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { currentUser } = useAuth();

  return (
    <header className="fixed top-0 left-app-edge right-app-edge z-50 h-header-safe pt-safe bg-background border-b border-border">
      <div className="flex items-center justify-between h-header px-4">
        <Logo />

        <div className="flex items-center gap-2">
          <UserAvatar />
          {currentUser && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
