'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { acceptTripInvitation, declineTripInvitation } from '@/services/trips.service';
import { Button } from '@/components/ui/button';

interface TripInvitationResponseButtonsProps {
  tripId: string;
  onSuccess: () => void;
  showMessage?: boolean;
}

export function TripInvitationResponseButtons({
  tripId,
  onSuccess,
  showMessage = true,
}: TripInvitationResponseButtonsProps) {
  const { t } = useTranslation(['trips', 'common']);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isAccepting || isDeclining;

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await acceptTripInvitation(tripId);
      onSuccess();
    } catch {
      setError(t('participants.invitation.acceptError'));
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    setError(null);
    try {
      await declineTripInvitation(tripId);
      onSuccess();
    } catch {
      setError(t('participants.invitation.declineError'));
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {showMessage && (
        <p className="text-sm text-muted-foreground">{t('participants.invitation.received')}</p>
      )}
      <div className="flex gap-2">
        <Button
          size="icon"
          onClick={handleAccept}
          disabled={isBusy}
          title={t('common:actions.accept')}
          aria-label={t('common:actions.accept')}
        >
          <CheckIcon aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecline}
          disabled={isBusy}
          title={t('common:actions.decline')}
          aria-label={t('common:actions.decline')}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
