'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunDimIcon, MoonIcon, DesktopIcon } from '@phosphor-icons/react';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';

const THEME_CYCLE = {
  light: 'dark',
  dark: 'system',
  system: 'light',
} as const;

/**
 * Gets the next theme in the cycle: light → dark → system → light
 */
export const getNextTheme = (current: string | undefined): string => {
  if (!current) return 'light';
  return THEME_CYCLE[current as keyof typeof THEME_CYCLE] || 'light';
};

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    const next = getNextTheme(theme);
    setTheme(next);
    if (currentUser) {
      void apiClient.patch('/v1/users/me/preferences', { theme: next.toUpperCase() });
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Current theme: ${theme}. Click to cycle through themes.`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <SunDimIcon className="w-5 h-5" weight="regular" />}
      {theme === 'dark' && <MoonIcon className="w-5 h-5" weight="regular" />}
      {theme === 'system' && <DesktopIcon className="w-5 h-5" weight="regular" />}
    </button>
  );
}
