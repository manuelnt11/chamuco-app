'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';

interface InvitationResponseButtonsProps {
  groupId: string;
  onSuccess: () => void;
}

export function InvitationResponseButtons({ groupId, onSuccess }: InvitationResponseButtonsProps) {
  const { t } = useTranslation('groups');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isAccepting || isDeclining;

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await apiClient.patch(`/v1/groups/${groupId}/invitations/accept`);
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
      await apiClient.patch(`/v1/groups/${groupId}/invitations/decline`);
      onSuccess();
    } catch {
      setError(t('members.invitation.declineError'));
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-sm text-muted-foreground">{t('members.invitation.received')}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDecline} disabled={isBusy}>
          {isDeclining ? t('members.invitation.declining') : t('members.invitation.decline')}
        </Button>
        <Button size="sm" onClick={handleAccept} disabled={isBusy}>
          {isAccepting ? t('members.invitation.accepting') : t('members.invitation.accept')}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
