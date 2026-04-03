'use client';

import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border">
      <div className="flex items-center justify-between h-full px-4">
        <Logo />

        <div className="flex items-center gap-2">
          <UserAvatar />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
