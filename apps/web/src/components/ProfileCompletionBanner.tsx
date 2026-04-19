'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

export const PROFILE_INCOMPLETE_KEY = 'chamuco_profile_incomplete';

export function ProfileCompletionBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(PROFILE_INCOMPLETE_KEY) === 'true');
  }, []);

  function dismiss() {
    localStorage.removeItem(PROFILE_INCOMPLETE_KEY);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium text-amber-900 dark:text-amber-200">
          {t('profileIncomplete.title')}
        </span>
        <span className="text-amber-700 dark:text-amber-400 truncate">
          {t('profileIncomplete.description')}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 dark:border-amber-700"
          render={<Link href="/profile" />}
        >
          {t('profileIncomplete.action')}
        </Button>
        <button
          type="button"
          aria-label={t('profileIncomplete.dismiss')}
          onClick={dismiss}
          className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
