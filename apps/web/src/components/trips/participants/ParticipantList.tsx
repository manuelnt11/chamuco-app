'use client';

import { useTranslation } from 'react-i18next';
import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';
import { ParticipantListItem } from './ParticipantListItem';
import { InviteParticipantModal } from './InviteParticipantModal';
import { ExportParticipantsPopover } from './ExportParticipantsPopover';
import type { TripParticipantResponse } from '@/services/trips.types';

interface ParticipantListProps {
  tripId: string;
  participants: TripParticipantResponse[];
  capacity: number;
  currentUserId: string | null;
  callerRole: TripRole | null;
  canInvite?: boolean;
  onInviteSuccess: () => void;
  onParticipantAction: () => void;
  excludedIds?: string[];
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

function Section({
  label,
  participants,
  tripId,
  currentUserId,
  callerRole,
  onParticipantAction,
}: {
  label: string;
  participants: TripParticipantResponse[];
  tripId: string;
  currentUserId: string | null;
  callerRole: TripRole | null;
  onParticipantAction: () => void;
}) {
  if (participants.length === 0) return null;
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
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
    </div>
  );
}

export function ParticipantList({
  tripId,
  participants,
  capacity,
  currentUserId,
  callerRole,
  canInvite = true,
  onInviteSuccess,
  onParticipantAction,
  excludedIds,
}: ParticipantListProps) {
  const { t } = useTranslation('trips');
  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

  const confirmed = participants.filter((p) => p.status === TripParticipantStatus.CONFIRMED);
  const pendingConfirmation = participants.filter(
    (p) => p.status === TripParticipantStatus.ACCEPTED,
  );

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-sm font-semibold">
          {t('participants.capacity', { active: participants.length, total: capacity })}
        </p>
        {isOrganizer && (
          <div className="flex items-center gap-1.5">
            <InviteParticipantModal
              tripId={tripId}
              onSuccess={onInviteSuccess}
              excludedIds={excludedIds}
              disabled={!canInvite}
            />
            <ExportParticipantsPopover tripId={tripId} />
          </div>
        )}
      </div>

      {participants.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">{t('participants.empty')}</p>
      ) : (
        <div className="pb-2">
          <Section
            label={t('participants.sections.confirmed', { count: confirmed.length })}
            participants={confirmed}
            tripId={tripId}
            currentUserId={currentUserId}
            callerRole={callerRole}
            onParticipantAction={onParticipantAction}
          />
          <Section
            label={t('participants.sections.pendingConfirmation', {
              count: pendingConfirmation.length,
            })}
            participants={pendingConfirmation}
            tripId={tripId}
            currentUserId={currentUserId}
            callerRole={callerRole}
            onParticipantAction={onParticipantAction}
          />
        </div>
      )}
    </div>
  );
}
