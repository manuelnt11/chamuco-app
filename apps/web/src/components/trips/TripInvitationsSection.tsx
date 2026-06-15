'use client';

import { useTranslation } from 'react-i18next';
import { useTripInvitations } from '@/store/trip-invitations';
import { TripInvitationResponseButtons } from '@/components/trips/participants/TripInvitationResponseButtons';

interface TripInvitationsSectionProps {
  onSuccess?: () => void;
}

export function TripInvitationsSection({ onSuccess }: TripInvitationsSectionProps) {
  const { t, i18n } = useTranslation('trips');
  const { invitations, count, refresh } = useTripInvitations();

  function handleSuccess() {
    void refresh();
    onSuccess?.();
  }

  if (count === 0) return null;

  return (
    <section
      aria-labelledby="trip-invitations-heading"
      className="mb-8 pb-8 border-b border-border"
    >
      <h2
        id="trip-invitations-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-500"
      >
        {t('invitations.titleWithCount', { count })}
      </h2>
      <div className="flex flex-col gap-3">
        {invitations.map(({ trip, initiatedAt }) => (
          <div
            key={trip.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20"
          >
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              {trip.coverUrl && (
                <img src={trip.coverUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-50 flex-1">
              <p className="truncate font-semibold text-sm">{trip.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(initiatedAt).toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <TripInvitationResponseButtons
                tripId={trip.id}
                onSuccess={handleSuccess}
                showMessage={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
