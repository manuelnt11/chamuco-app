'use client';

import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

function humanizeAchievementId(id: string): string {
  return id
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface PublicProfileAchievementsProps {
  achievements: string[];
}

export function PublicProfileAchievements({ achievements }: PublicProfileAchievementsProps) {
  const { t } = useTranslation('profile');

  return (
    <section aria-labelledby="achievements-heading">
      <h2
        id="achievements-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('publicProfile.achievements.heading')}
      </h2>
      {achievements.length === 0 ? (
        <EmptyState title={t('publicProfile.achievements.empty')} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {achievements.map((id) => (
            <Badge key={id} variant="secondary">
              {humanizeAchievementId(id)}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
