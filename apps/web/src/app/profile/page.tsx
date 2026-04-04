'use client';

import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation('profile');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground">{t('personalInfo')}</p>
    </div>
  );
}
