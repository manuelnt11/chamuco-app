'use client';

import { useTranslation } from 'react-i18next';

export default function ExplorePage() {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('navigation.explore')}</h1>
      <p className="text-muted-foreground">Discover new destinations and travel groups</p>
    </div>
  );
}
