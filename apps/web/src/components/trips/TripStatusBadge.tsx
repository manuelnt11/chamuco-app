'use client';

import { useTranslation } from 'react-i18next';
import type { TripStatus } from '@chamuco/shared-types';

import { STATUS_CLASSES, STATUS_I18N_KEYS } from '@/components/trips/trip-status';
import Link from 'next/link';
import { InfoIcon } from '@phosphor-icons/react';

interface TripStatusBadgeProps {
  status: TripStatus;
  hideGuideLink?: boolean;
}

export function TripStatusBadge({ status, hideGuideLink }: TripStatusBadgeProps) {
  const { t } = useTranslation('trips');
  return (
    <span
      data-testid="status-badge"
      className={`shrink-0 rounded-full py-0.5 text-xs font-medium ${hideGuideLink ? 'px-2.5' : 'pl-2.5 pr-2'} ${STATUS_CLASSES[status]}`}
    >
      {t(STATUS_I18N_KEYS[status])}
      {!hideGuideLink && (
        <Link
          href="/trips/status-guide"
          className="inline-flex pl-1 align-text-bottom transition-colors hover:text-foreground"
          title={t('statusGuide.infoButtonLabel')}
          aria-label={t('statusGuide.infoButtonLabel')}
        >
          <InfoIcon className="size-4" aria-hidden="true" />
        </Link>
      )}
    </span>
  );
}
