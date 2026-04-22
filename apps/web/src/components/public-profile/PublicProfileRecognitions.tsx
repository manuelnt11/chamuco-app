'use client';

import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { humanizeId } from '@/lib/name-utils';

export interface PublicProfileRecognitionsProps {
  recognitions: string[];
}

export function PublicProfileRecognitions({ recognitions }: PublicProfileRecognitionsProps) {
  const { t } = useTranslation('profile');

  return (
    <section aria-labelledby="recognitions-heading">
      <h2
        id="recognitions-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('publicProfile.recognitions.heading')}
      </h2>
      {recognitions.length === 0 ? (
        <EmptyState title={t('publicProfile.recognitions.empty')} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {recognitions.map((id, index) => (
            <Badge key={`${id}-${index}`} variant="outline">
              {humanizeId(id)}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
