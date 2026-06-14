'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { submitJoinRequest, withdrawJoinRequest } from '@/services/trips.service';
import { Button } from '@/components/ui/button';

interface JoinTripButtonProps {
  tripId: string;
  hasPendingRequest: boolean;
  onSuccess: () => void;
}

export function JoinTripButton({ tripId, hasPendingRequest, onSuccess }: JoinTripButtonProps) {
  const { t } = useTranslation('trips');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRequest = async () => {
    setIsLoading(true);
    try {
      await submitJoinRequest(tripId);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await withdrawJoinRequest(tripId);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPendingRequest) {
    return (
      <Button variant="outline" size="sm" onClick={handleWithdraw} disabled={isLoading}>
        {isLoading
          ? t('participants.joinRequest.withdrawing')
          : t('participants.joinRequest.withdraw')}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleJoinRequest} disabled={isLoading}>
      {isLoading ? t('participants.joinRequest.requesting') : t('participants.joinRequest.button')}
    </Button>
  );
}
