'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import type { AppTheme } from '@chamuco/shared-types';

import { useAuth } from '@/hooks/useAuth';
import { updateMyPreferences } from '@/services/users.service';
import { toast } from '@/components/ui/toast';

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

/**
 * Shared theme-cycling behavior for ThemeToggle and the UserAvatar dropdown.
 * Applies the next theme optimistically, then persists it for signed-in users;
 * a failed persist rolls the theme back and surfaces an error toast so local
 * state never drifts from what's saved on the server.
 */
export function useThemeCycle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useTranslation('errors');

  useEffect(() => {
    setMounted(true);
  }, []);

  function cycleTheme() {
    const previous = theme ?? 'system';
    const next = getNextTheme(theme);
    setTheme(next);

    if (currentUser) {
      updateMyPreferences({ theme: next.toUpperCase() as AppTheme }).catch(() => {
        setTheme(previous);
        toast.error(t('generic'));
      });
    }
  }

  return { theme, mounted, cycleTheme };
}
