'use client';

import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-header-safe pt-safe bg-background border-b border-border">
      <div className="flex items-center justify-between h-header px-4">
        <Logo />

        <div className="flex items-center gap-2">
          <UserAvatar />
          <NotificationBell />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
