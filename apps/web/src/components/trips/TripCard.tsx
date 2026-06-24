'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AirplaneTakeoffIcon, AirplaneLandingIcon, UsersIcon } from '@phosphor-icons/react';
import { TripRole } from '@chamuco/shared-types';
import type { MyTripListItemResponse } from '@/services/trips.types';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';

interface TripCardProps {
  trip: MyTripListItemResponse;
}

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
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{trip.name}</p>
          <TripStatusBadge status={trip.status} hideGuideLink />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <AirplaneTakeoffIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trip.startDate}
          </span>
          <span className="flex items-center gap-1">
            <AirplaneLandingIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trip.endDate}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{trip.departureCity}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {trip.confirmedParticipantCount} {t('card.capacityOf')} {trip.participantCapacity}
          </p>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {t(ROLE_I18N_KEYS[trip.userRole])}
          </span>
        </div>
      </div>
    </Link>
  );
}
