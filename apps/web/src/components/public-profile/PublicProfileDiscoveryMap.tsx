'use client';

import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

export interface PublicProfileDiscoveryMapProps {
  countries: string[];
}

export function PublicProfileDiscoveryMap({ countries }: PublicProfileDiscoveryMapProps) {
  const { t } = useTranslation('profile');

  return (
    <section aria-labelledby="discovery-map-heading">
      <h2
        id="discovery-map-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('publicProfile.discoveryMap.heading')}
      </h2>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          {t('publicProfile.discoveryMap.placeholder')}
        </p>
        {countries.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {countries.map((code) => (
              <Badge key={code} variant="outline" className="font-mono text-xs">
                {code}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
