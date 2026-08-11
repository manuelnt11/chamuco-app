'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@phosphor-icons/react';

import { getMyGroupJoinRequests, withdrawGroupJoinRequest } from '@/services/groups.service';
import { Button } from '@/components/ui/button';
import type { MyGroupJoinRequest } from '@/types/group';

export function GroupJoinRequestsSection() {
  const { t } = useTranslation('groups');
  const [requests, setRequests] = useState<MyGroupJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    getMyGroupJoinRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function handleCancel(groupId: string) {
    setCancellingId(groupId);
    setErrorId(null);
    try {
      await withdrawGroupJoinRequest(groupId);
      setRequests((prev) => prev.filter((request) => request.groupId !== groupId));
    } catch {
      setErrorId(groupId);
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading || requests.length === 0) return null;

  return (
    <section aria-labelledby="my-join-requests-heading" className="mb-6">
      <h2
        id="my-join-requests-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {t('members.myRequests.titleWithCount', { count: requests.length })}
      </h2>
      <div className="flex flex-col gap-3">
        {requests.map((request) => (
          <div
            key={request.groupId}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Link
              href={`/groups/${request.groupId}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                <img src={request.coverUrl} alt="" className="size-full object-cover" />
              </div>
              <div className="min-w-50 flex-1">
                <p className="truncate font-semibold text-sm">{request.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.initiatedAt).toLocaleDateString(undefined, {
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
                onClick={() => handleCancel(request.groupId)}
                disabled={cancellingId === request.groupId}
                title={t('members.myRequests.cancel')}
                aria-label={t('members.myRequests.cancel')}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
              {errorId === request.groupId && (
                <p className="text-xs text-destructive">{t('members.myRequests.cancelError')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
