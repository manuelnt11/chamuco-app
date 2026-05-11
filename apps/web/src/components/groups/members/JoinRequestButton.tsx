'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/services/api-client';
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
      await apiClient.post(`/v1/groups/${groupId}/join-request`);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/v1/groups/${groupId}/members/${userId}`);
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
