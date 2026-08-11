'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@phosphor-icons/react';

import { getMyTripJoinRequests, withdrawJoinRequest } from '@/services/trips.service';
import { Button } from '@/components/ui/button';
import type { MyTripJoinRequestResponse } from '@/services/trips.types';

export function TripJoinRequestsSection() {
  const { t, i18n } = useTranslation('trips');
  const [requests, setRequests] = useState<MyTripJoinRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    getMyTripJoinRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function handleCancel(tripId: string) {
    setCancellingId(tripId);
    setErrorId(null);
    try {
      await withdrawJoinRequest(tripId);
      setRequests((prev) => prev.filter((request) => request.tripId !== tripId));
    } catch {
      setErrorId(tripId);
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading || requests.length === 0) return null;

  return (
    <section aria-labelledby="my-trip-join-requests-heading" className="mb-6">
      <h2
        id="my-trip-join-requests-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('participants.myRequests.titleWithCount', { count: requests.length })}
      </h2>
      <div className="flex flex-col gap-3">
        {requests.map((request) => (
          <div
            key={request.tripId}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Link
              href={`/trips/${request.tripId}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                {request.coverUrl && (
                  <img src={request.coverUrl} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-50 flex-1">
                <p className="truncate font-semibold text-sm">{request.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.initiatedAt).toLocaleDateString(i18n.language, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </Link>
            <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCancel(request.tripId)}
                disabled={cancellingId === request.tripId}
                title={t('participants.myRequests.cancel')}
                aria-label={t('participants.myRequests.cancel')}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
              {errorId === request.tripId && (
                <p className="text-xs text-destructive">
                  {t('participants.myRequests.cancelError')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
