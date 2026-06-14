'use client';

import { useTranslation } from 'react-i18next';
import type { TripStatus } from '@chamuco/shared-types';

import { STATUS_CLASSES, STATUS_I18N_KEYS } from '@/components/trips/trip-status';

interface TripStatusBadgeProps {
  status: TripStatus;
}

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  const { t } = useTranslation('trips');
  return (
    <span
      data-testid="status-badge"
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(STATUS_I18N_KEYS[status])}
    </span>
  );
}
