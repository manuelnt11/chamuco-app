'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@chamuco/shared-types';
import type { SupportedLanguage } from '@/lib/i18n/config';
import { getNextLanguage } from '@/lib/i18n/utils';
import { changeLanguage } from '@/lib/i18n/client';
import { useAuth } from '@/hooks/useAuth';
import { updateMyPreferences } from '@/services/users.service';
import { toast } from '@/components/ui/toast';

/**
 * Shared language-cycling behavior for LanguageToggle and the UserAvatar dropdown.
 * Applies the next language optimistically, then persists it for signed-in users;
 * a failed persist rolls the language back and surfaces an error toast so local
 * state never drifts from what's saved on the server.
 */
export function useLanguageCycle() {
  const [mounted, setMounted] = useState(false);
  const { i18n, t } = useTranslation('errors');
  const { currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const language = i18n.language as SupportedLanguage;

  async function cycleLanguage() {
    const previous = language;
    const next = getNextLanguage(previous);
    await changeLanguage(next);

    if (currentUser) {
      updateMyPreferences({ language: next.toUpperCase() as AppLanguage }).catch(() => {
        void changeLanguage(previous);
        toast.error(t('generic'));
      });
    }
  }

  return { language, mounted, cycleLanguage };
}
