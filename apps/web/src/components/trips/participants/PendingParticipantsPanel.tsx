'use client';

import { useTranslation } from 'react-i18next';
import { TripParticipantStatus } from '@chamuco/shared-types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  acceptJoinRequest,
  rejectJoinRequest,
  revokeTripInvitation,
} from '@/services/trips.service';
import type { PendingTripParticipantResponse } from '@/services/trips.types';

interface PendingParticipantsPanelProps {
  tripId: string;
  items: PendingTripParticipantResponse[];
  onUpdate: () => void;
}

export function PendingParticipantsPanel({
  tripId,
  items,
  onUpdate,
}: PendingParticipantsPanelProps) {
  const { t } = useTranslation('trips');

  const handleAccept = async (userId: string) => {
    await acceptJoinRequest(tripId, userId);
    onUpdate();
  };

  const handleReject = async (userId: string) => {
    await rejectJoinRequest(tripId, userId);
    onUpdate();
  };

  const handleRevoke = async (userId: string) => {
    await revokeTripInvitation(tripId, userId);
    onUpdate();
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold mb-3">
          {t('participants.pending.title', { count: 0 })}
        </p>
        <p className="text-sm text-muted-foreground">{t('participants.pending.noItems')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-semibold mb-3">
        {t('participants.pending.title', { count: items.length })}
      </p>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const initials = item.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <li key={item.userId} className="flex items-center gap-3 py-3">
              <Avatar
                src={item.avatarUrl ?? undefined}
                alt={item.displayName}
                fallback={initials}
                size="sm"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
              </div>

              <Badge variant="outline" className="shrink-0">
                {item.status === TripParticipantStatus.PENDING_REQUEST
                  ? t('participants.pending.statusRequest')
                  : t('participants.pending.statusInvited')}
              </Badge>

              <div className="flex shrink-0 gap-1.5">
                {item.status === TripParticipantStatus.PENDING_REQUEST ? (
                  <>
                    <Button size="xs" onClick={() => void handleAccept(item.userId)}>
                      {t('participants.pending.accept')}
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => void handleReject(item.userId)}
                    >
                      {t('participants.pending.reject')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => void handleRevoke(item.userId)}
                  >
                    {t('participants.pending.revoke')}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
