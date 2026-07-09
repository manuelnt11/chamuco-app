'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORGANIZER_ROLES, TripParticipantStatus, TripRole } from '@chamuco/shared-types';
import {
  AirplaneIcon,
  CheckFatIcon,
  QuestionMarkIcon,
  ShieldStarIcon,
  UserMinusIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/name-utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteConfirmButton } from '@/components/ui/delete-confirm-button';
import { toast } from '@/components/ui/toast';
import {
  removeTripParticipant,
  toggleTripParticipantConfirmation,
  updateTripParticipantRole,
} from '@/services/trips.service';
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
  const [isToggling, setIsToggling] = useState(false);

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

  async function handleToggleConfirmation() {
    setIsToggling(true);
    try {
      await toggleTripParticipantConfirmation(tripId, participant.userId);
      onActionSuccess();
    } catch {
      toast.error(t('participants.actions.confirmError'));
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-3 sm:items-center">
      <Avatar
        src={participant.avatarUrl ?? undefined}
        alt={participant.displayName}
        fallback={getInitials(participant.displayName)}
        size="md"
        className="mt-0.5 sm:mt-0"
      />

      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{participant.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{participant.username}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 mt-1.5 sm:mt-0 sm:flex-nowrap sm:shrink-0">
          {participant.role !== TripRole.PARTICIPANT && (
            <Badge variant={ROLE_VARIANT[participant.role]}>
              {t(`participants.role.${participant.role}`)}
            </Badge>
          )}

          {(participant.role === TripRole.ORGANIZER ||
            participant.role === TripRole.CO_ORGANIZER) &&
            participant.isTraveler && (
              <Badge variant="outline" className="gap-1">
                <AirplaneIcon className="size-3" aria-hidden="true" />
                {t('participants.traveler')}
              </Badge>
            )}

          <div className="flex gap-1 ml-auto sm:ml-0.5 shrink-0">
            {isOrganizer && participant.role !== TripRole.ORGANIZER && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleToggleConfirmation()}
                disabled={isToggling}
                className={cn(
                  participant.status === TripParticipantStatus.CONFIRMED
                    ? 'text-green-600 hover:text-green-600'
                    : 'text-orange-500 hover:text-orange-500',
                )}
                title={t(
                  participant.status === TripParticipantStatus.CONFIRMED
                    ? 'participants.actions.unconfirm'
                    : 'participants.actions.confirm',
                )}
                aria-label={t(
                  participant.status === TripParticipantStatus.CONFIRMED
                    ? 'participants.actions.unconfirm'
                    : 'participants.actions.confirm',
                )}
              >
                {participant.status === TripParticipantStatus.CONFIRMED ? (
                  <CheckFatIcon aria-hidden="true" weight="fill" />
                ) : (
                  <QuestionMarkIcon aria-hidden="true" weight="bold" />
                )}
              </Button>
            )}

            {showActions && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
