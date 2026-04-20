'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import { changeLanguage } from '@/lib/i18n/client';

interface UserPreferences {
  language: string;
  theme: string;
}

/**
 * Invisible component that fetches the user's saved preferences from the DB
 * once per login and applies them (language + theme). Must be rendered inside
 * both AuthProvider and ThemeProvider.
 */
export function PreferencesSync() {
  const { currentUser, isLoading } = useAuth();
  const { setTheme } = useTheme();
  const appliedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      appliedForUid.current = null;
      return;
    }
    if (isLoading) return;
    if (appliedForUid.current === currentUser.uid) return;

    void (async () => {
      try {
        const res = await apiClient.get<UserPreferences>('/v1/users/me/preferences');
        await changeLanguage(res.data.language.toLowerCase());
        setTheme(res.data.theme.toLowerCase());
        appliedForUid.current = currentUser.uid;
      } catch {
        // Silently fall back to browser defaults if preferences can't be loaded.
      }
    })();
  }, [currentUser, isLoading, setTheme]);

  return null;
}
