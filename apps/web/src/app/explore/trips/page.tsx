'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TripDiscoveryCard } from '@/components/trips/TripDiscoveryCard';
import { useTripSearch } from '@/hooks/useTripSearch';
import type { TripSearchResult } from '@/services/trips.types';

export default function ExploreTripsPage() {
  const { t } = useTranslation('trips');
  const [query, setQuery] = useState('');

  const { results: fetchedResults, total, isLoading } = useTripSearch(query);

  const [statusOverrides, setStatusOverrides] = useState<
    Map<string, 'none' | 'pending' | 'active'>
  >(new Map());

  useEffect(() => {
    setStatusOverrides(new Map());
  }, [query]);

  const handleStatusChange = (tripId: string, newStatus: 'none' | 'pending' | 'active') => {
    setStatusOverrides((prev) => new Map(prev).set(tripId, newStatus));
  };

  const results: TripSearchResult[] = fetchedResults.map((trip) => ({
    ...trip,
    participationStatus: statusOverrides.get(trip.id) ?? trip.participationStatus,
  }));

  const isEmpty = !query.trim();
  const noResults = !isEmpty && !isLoading && results.length === 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t('search.pageTitle')}</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
        aria-label={t('search.placeholder')}
      />

      {isLoading && <p className="text-sm text-muted-foreground">{t('search.loading')}</p>}

      {isEmpty && !isLoading && (
        <p className="text-sm text-muted-foreground">{t('search.empty')}</p>
      )}

      {noResults && (
        <p className="text-sm text-muted-foreground">{t('search.noResults', { query })}</p>
      )}

      {!isEmpty && !isLoading && results.length > 0 && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {t('search.resultCount', { count: total })}
          </p>
          <div className="flex flex-col gap-3">
            {results.map((trip) => (
              <TripDiscoveryCard key={trip.id} trip={trip} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
