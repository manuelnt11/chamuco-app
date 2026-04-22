'use client';

import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { humanizeId } from '@/lib/name-utils';

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
              {humanizeId(id)}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
