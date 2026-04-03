'use client';

import { useTranslation } from 'react-i18next';

export default function TripsPage() {
  const { t } = useTranslation('trips');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground">{t('myTrips')}</p>
    </div>
  );
}
