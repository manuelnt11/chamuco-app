'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TripRole } from '@chamuco/shared-types';
import { AirplaneIcon, ShieldStarIcon, UserMinusIcon } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteConfirmButton } from '@/components/ui/delete-confirm-button';
import { toast } from '@/components/ui/toast';
import { removeTripParticipant, updateTripParticipantRole } from '@/services/trips.service';
import type { TripParticipantResponse } from '@/services/trips.types';

interface ParticipantListItemProps {
  participant: TripParticipantResponse;
  tripId: string;
  currentUserId: string | null;
  callerRole: TripRole | null;
  onActionSuccess: () => void;
}

const ROLE_VARIANT: Record<TripRole, 'default' | 'secondary' | 'outline'> = {
  [TripRole.ORGANIZER]: 'default',
  [TripRole.CO_ORGANIZER]: 'secondary',
  [TripRole.PARTICIPANT]: 'outline',
};

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export function ParticipantListItem({
  participant,
  tripId,
  currentUserId,
  callerRole,
  onActionSuccess,
}: ParticipantListItemProps) {
  const { t } = useTranslation('trips');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);

  const initials = participant.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);
  const isSelf = participant.userId === currentUserId;
  const isTargetOrganizer = participant.role === TripRole.ORGANIZER;

  const showActions = isOrganizer && !isSelf && !isTargetOrganizer;
  const showPromote = showActions && participant.role === TripRole.PARTICIPANT;
  const showDemote = showActions && participant.role === TripRole.CO_ORGANIZER;

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await removeTripParticipant(tripId, participant.userId);
      onActionSuccess();
    } catch {
      toast.error(t('participants.actions.removeError'));
    } finally {
      setIsRemoving(false);
    }
  }

  async function handlePromote() {
    setIsPromoting(true);
    try {
      await updateTripParticipantRole(tripId, participant.userId, { role: TripRole.CO_ORGANIZER });
      onActionSuccess();
    } catch {
      toast.error(t('participants.actions.promoteError'));
    } finally {
      setIsPromoting(false);
    }
  }

  async function handleDemote() {
    setIsDemoting(true);
    try {
      await updateTripParticipantRole(tripId, participant.userId, { role: TripRole.PARTICIPANT });
      onActionSuccess();
    } catch {
      toast.error(t('participants.actions.demoteError'));
    } finally {
      setIsDemoting(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-3 sm:items-center">
      <Avatar
        src={participant.avatarUrl ?? undefined}
        alt={participant.displayName}
        fallback={initials}
        size="md"
        className="mt-0.5 sm:mt-0"
      />

      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{participant.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{participant.username}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 mt-1.5 sm:mt-0 sm:flex-nowrap sm:shrink-0">
          <Badge variant={ROLE_VARIANT[participant.role]}>
            {t(`participants.role.${participant.role}`)}
          </Badge>

          {participant.isTraveler && (
            <Badge variant="outline" className="gap-1">
              <AirplaneIcon className="size-3" aria-hidden="true" />
              {t('participants.traveler')}
            </Badge>
          )}

          {showActions && (
            <div className="flex gap-1 ml-auto sm:ml-0.5 shrink-0">
              {showPromote && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void handlePromote()}
                  disabled={isPromoting}
                  title={t('participants.actions.promote')}
                  aria-label={t('participants.actions.promote')}
                >
                  <ShieldStarIcon aria-hidden="true" />
                </Button>
              )}
              {showDemote && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void handleDemote()}
                  disabled={isDemoting}
                  title={t('participants.actions.demote')}
                  aria-label={t('participants.actions.demote')}
                >
                  <UserMinusIcon aria-hidden="true" />
                </Button>
              )}
              <DeleteConfirmButton onDelete={handleRemove} disabled={isRemoving} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
