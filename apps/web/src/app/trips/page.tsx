'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { TripStatus } from '@chamuco/shared-types';

import { getMyTrips } from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { TripCard } from '@/components/trips/TripCard';
import { TripInvitationsSection } from '@/components/trips/TripInvitationsSection';
import { TripJoinRequestsSection } from '@/components/trips/TripJoinRequestsSection';
import type { MyTripListItemResponse } from '@/services/trips.types';

type Tab = 'upcoming' | 'past';

const UPCOMING_STATUSES: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.OPEN,
  TripStatus.CONFIRMED,
  TripStatus.IN_PROGRESS,
];

export default function TripsPage() {
  const { t } = useTranslation(['trips', 'common']);
  const { isLoading: isAuthLoading } = useAuth();
  const [trips, setTrips] = useState<MyTripListItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  function fetchTrips() {
    setIsLoading(true);
    getMyTrips()
      .then((data) => setTrips(data))
      .catch(() => setTrips([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (isAuthLoading) return;
    fetchTrips();
  }, [isAuthLoading]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: t('tabs.upcoming') },
    { key: 'past', label: t('tabs.past') },
  ];

  const visibleTrips = trips.filter((trip) =>
    activeTab === 'upcoming'
      ? UPCOMING_STATUSES.includes(trip.status)
      : !UPCOMING_STATUSES.includes(trip.status),
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/explore/trips"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
            title={t('common:actions.search')}
            aria-label={t('common:actions.search')}
          >
            <MagnifyingGlassIcon className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
            title={t('common:actions.create')}
            aria-label={t('common:actions.create')}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t('title')}
        className="flex gap-1 border-b border-border mb-6"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            type="button"
            aria-selected={activeTab === key}
            aria-controls={`tabpanel-${key}`}
            onClick={() => setActiveTab(key)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next: Tab = key === 'upcoming' ? 'past' : 'upcoming';
                setActiveTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev: Tab = key === 'upcoming' ? 'past' : 'upcoming';
                setActiveTab(prev);
                document.getElementById(`tab-${prev}`)?.focus();
              }
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="mb-6"
      >
        {isLoading ? null : visibleTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-foreground">{t('detail.noTrips')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('detail.createFirst')}</p>
            <Link
              href="/trips/new"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('common:actions.create')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      <TripInvitationsSection onSuccess={fetchTrips} />
      <TripJoinRequestsSection />
    </div>
  );
}
