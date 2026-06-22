'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { submitJoinRequest, withdrawJoinRequest } from '@/services/trips.service';
import { Button } from '@/components/ui/button';
import type { TripSearchResult } from '@/services/trips.types';

interface TripDiscoveryCardProps {
  trip: TripSearchResult;
  onStatusChange: (tripId: string, newStatus: 'none' | 'pending' | 'active') => void;
}

export function TripDiscoveryCard({ trip, onStatusChange }: TripDiscoveryCardProps) {
  const { t } = useTranslation('trips');
  const [isLoading, setIsLoading] = useState(false);

  const visibleDestinations = trip.destinations.slice(0, 3);
  const hiddenCount = trip.destinations.length - visibleDestinations.length;
  const destinationLabel =
    visibleDestinations.map((d) => d.city).join(' · ') +
    (hiddenCount > 0 ? ` +${hiddenCount}` : '');

  const handleJoinRequest = async () => {
    setIsLoading(true);
    try {
      await submitJoinRequest(trip.id);
      onStatusChange(trip.id, 'pending');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await withdrawJoinRequest(trip.id);
      onStatusChange(trip.id, 'none');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{trip.name}</p>
        {trip.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{trip.description}</p>
        )}
        {destinationLabel && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{destinationLabel}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {trip.startDate} – {trip.endDate}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('search.participants', {
            confirmed: trip.confirmedParticipantCount,
            capacity: trip.participantCapacity,
          })}
        </p>
      </div>

      <div className="shrink-0">
        {trip.participationStatus === 'active' ? (
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t('search.viewTrip')}
          </Link>
        ) : trip.participationStatus === 'pending' ? (
          <Button variant="outline" size="sm" onClick={handleWithdraw} disabled={isLoading}>
            {isLoading ? t('search.joinRequest.withdrawing') : t('search.joinRequest.withdraw')}
          </Button>
        ) : (
          <Button size="sm" onClick={handleJoinRequest} disabled={isLoading}>
            {isLoading ? t('search.joinRequest.requesting') : t('search.joinRequest.button')}
          </Button>
        )}
      </div>
    </div>
  );
}
