'use client';

import { useTranslation } from 'react-i18next';
import { TripRole } from '@chamuco/shared-types';
import { ParticipantListItem } from './ParticipantListItem';
import { InviteParticipantModal } from './InviteParticipantModal';
import type { TripParticipantResponse } from '@/services/trips.types';

interface ParticipantListProps {
  tripId: string;
  participants: TripParticipantResponse[];
  capacity: number;
  currentUserId: string | null;
  callerRole: TripRole | null;
  onInviteSuccess: () => void;
  onParticipantAction: () => void;
  excludedIds?: string[];
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export function ParticipantList({
  tripId,
  participants,
  capacity,
  currentUserId,
  callerRole,
  onInviteSuccess,
  onParticipantAction,
  excludedIds,
}: ParticipantListProps) {
  const { t } = useTranslation('trips');
  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-sm font-semibold">
          {t('participants.capacity', { confirmed: participants.length, total: capacity })}
        </p>
        {isOrganizer && (
          <InviteParticipantModal
            tripId={tripId}
            onSuccess={onInviteSuccess}
            excludedIds={excludedIds}
          />
        )}
      </div>

      {participants.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">{t('participants.empty')}</p>
      ) : (
        <ul className="divide-y divide-border px-4">
          {participants.map((participant) => (
            <ParticipantListItem
              key={participant.userId}
              participant={participant}
              tripId={tripId}
              currentUserId={currentUserId}
              callerRole={callerRole}
              onActionSuccess={onParticipantAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
