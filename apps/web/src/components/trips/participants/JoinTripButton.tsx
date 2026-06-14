'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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
  const [error, setError] = useState<string | null>(null);

  const handleJoinRequest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await submitJoinRequest(tripId);
      onSuccess();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? t('participants.joinRequest.capacityFull')
          : t('participants.joinRequest.error');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await withdrawJoinRequest(tripId);
      onSuccess();
    } catch {
      setError(t('participants.joinRequest.withdrawError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {hasPendingRequest ? (
        <Button variant="outline" size="sm" onClick={handleWithdraw} disabled={isLoading}>
          {isLoading
            ? t('participants.joinRequest.withdrawing')
            : t('participants.joinRequest.withdraw')}
        </Button>
      ) : (
        <Button size="sm" onClick={handleJoinRequest} disabled={isLoading}>
          {isLoading
            ? t('participants.joinRequest.requesting')
            : t('participants.joinRequest.button')}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
