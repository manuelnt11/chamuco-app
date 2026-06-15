'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { removeTripParticipant } from '@/services/trips.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LeaveTripButtonProps {
  tripId: string;
  userId: string;
}

export function LeaveTripButton({ tripId, userId }: LeaveTripButtonProps) {
  const { t } = useTranslation('trips');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLeaving(true);
    setError(null);
    try {
      await removeTripParticipant(tripId, userId);
      setOpen(false);
      router.push('/trips');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? t('participants.leave.lastOrganizer')
          : t('participants.leave.error');
      setError(message);
      setIsLeaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isLeaving) setOpen(newOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            {t('participants.leave.button')}
          </Button>
        }
      />
      <DialogPopup>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{t('participants.leave.button')}</DialogTitle>
          <DialogDescription>{t('participants.leave.confirm')}</DialogDescription>
        </DialogHeader>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <DialogFooter className="mt-4">
          <DialogClose
            render={
              <Button variant="outline" size="sm" disabled={isLeaving}>
                {t('participants.leave.cancel')}
              </Button>
            }
          />
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={isLeaving}>
            {isLeaving ? t('participants.leave.leaving') : t('participants.leave.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
