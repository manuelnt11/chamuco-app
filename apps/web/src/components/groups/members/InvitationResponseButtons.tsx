'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { acceptGroupInvitation, declineGroupInvitation } from '@/services/groups.service';
import { Button } from '@/components/ui/button';

interface InvitationResponseButtonsProps {
  groupId: string;
  onSuccess: () => void;
  showMessage?: boolean;
}

export function InvitationResponseButtons({
  groupId,
  onSuccess,
  showMessage = true,
}: InvitationResponseButtonsProps) {
  const { t } = useTranslation(['groups', 'common']);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isAccepting || isDeclining;

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await acceptGroupInvitation(groupId);
      onSuccess();
    } catch {
      setError(t('members.invitation.acceptError'));
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    setError(null);
    try {
      await declineGroupInvitation(groupId);
      onSuccess();
    } catch {
      setError(t('members.invitation.declineError'));
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {showMessage && (
        <p className="text-sm text-muted-foreground">{t('members.invitation.received')}</p>
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
