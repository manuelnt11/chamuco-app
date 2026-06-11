'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { joinGroup, leaveGroup } from '@/services/groups.service';
import { Button } from '@/components/ui/button';

interface JoinRequestButtonProps {
  groupId: string;
  userId: string;
  hasPendingRequest: boolean;
  onSuccess: () => void;
}

export function JoinRequestButton({
  groupId,
  userId,
  hasPendingRequest,
  onSuccess,
}: JoinRequestButtonProps) {
  const { t } = useTranslation('groups');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRequest = async () => {
    setIsLoading(true);
    try {
      await joinGroup(groupId);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await leaveGroup(groupId, userId);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPendingRequest) {
    return (
      <Button variant="outline" size="sm" onClick={handleWithdraw} disabled={isLoading}>
        {isLoading ? t('members.joinRequest.withdrawing') : t('members.joinRequest.withdraw')}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleJoinRequest} disabled={isLoading}>
      {isLoading ? t('members.joinRequest.requesting') : t('members.joinRequest.button')}
    </Button>
  );
}
