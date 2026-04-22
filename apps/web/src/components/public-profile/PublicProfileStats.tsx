'use client';

import { useTranslation } from 'react-i18next';

export interface KeyStats {
  tripsCompleted: number;
  countriesVisited: number;
  citiesVisited: number;
  kmTraveled: number;
  tripsAsOrganizer: number;
}

export interface PublicProfileStatsProps {
  keyStats: KeyStats;
}

interface StatItemProps {
  value: number;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold text-foreground">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function PublicProfileStats({ keyStats }: PublicProfileStatsProps) {
  const { t } = useTranslation('profile');

  return (
    <section aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('publicProfile.stats.heading')}
      </h2>
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <StatItem value={keyStats.tripsCompleted} label={t('publicProfile.stats.tripsCompleted')} />
        <StatItem
          value={keyStats.countriesVisited}
          label={t('publicProfile.stats.countriesVisited')}
        />
        <StatItem value={keyStats.kmTraveled} label={t('publicProfile.stats.kmTraveled')} />
        <StatItem
          value={keyStats.tripsAsOrganizer}
          label={t('publicProfile.stats.tripsAsOrganizer')}
        />
      </div>
    </section>
  );
}
