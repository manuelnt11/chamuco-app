'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ExplorePage() {
  const { t } = useTranslation('explore');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">{t('subtitle')}</p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/explore/trips"
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted/50"
        >
          <span className="text-lg font-semibold">{t('discoverTrips')}</span>
          <span className="text-sm text-muted-foreground">{t('discoverTripsSubtitle')}</span>
        </Link>
        <Link
          href="/explore/groups"
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted/50"
        >
          <span className="text-lg font-semibold">{t('discoverGroups')}</span>
          <span className="text-sm text-muted-foreground">{t('discoverGroupsSubtitle')}</span>
        </Link>
      </div>
    </div>
  );
}
