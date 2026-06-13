'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AirplaneTakeoffIcon, AirplaneLandingIcon, UsersIcon } from '@phosphor-icons/react';
import { TripRole, TripStatus } from '@chamuco/shared-types';
import type { MyTripListItemResponse } from '@/services/trips.types';

interface TripCardProps {
  trip: MyTripListItemResponse;
}

const STATUS_CLASSES: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'bg-muted text-muted-foreground',
  [TripStatus.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [TripStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [TripStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [TripStatus.COMPLETED]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  [TripStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_I18N_KEYS: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'status.draft',
  [TripStatus.OPEN]: 'status.open',
  [TripStatus.CONFIRMED]: 'status.confirmed',
  [TripStatus.IN_PROGRESS]: 'status.inProgress',
  [TripStatus.COMPLETED]: 'status.completed',
  [TripStatus.CANCELLED]: 'status.cancelled',
};

const ROLE_I18N_KEYS: Record<TripRole, string> = {
  [TripRole.ORGANIZER]: 'role.organizer',
  [TripRole.CO_ORGANIZER]: 'role.coOrganizer',
  [TripRole.PARTICIPANT]: 'role.participant',
};

export function TripCard({ trip }: TripCardProps) {
  const { t } = useTranslation('trips');

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div
        data-testid="trip-cover"
        className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center"
      >
        {trip.coverUrl ? (
          <img src={trip.coverUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{trip.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <AirplaneTakeoffIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trip.startDate}
          </span>
          <span>–</span>
          <span className="flex items-center gap-1">
            <AirplaneLandingIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trip.endDate}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{trip.departureCity}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {trip.confirmedParticipantCount} {t('card.capacityOf')} {trip.participantCapacity}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          data-testid="status-badge"
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[trip.status]}`}
        >
          {t(STATUS_I18N_KEYS[trip.status])}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {t(ROLE_I18N_KEYS[trip.userRole])}
        </span>
      </div>
    </Link>
  );
}
