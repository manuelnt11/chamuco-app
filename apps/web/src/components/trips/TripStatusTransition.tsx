'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TripStatus } from '@chamuco/shared-types';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { transitionTripStatus } from '@/services/trips.service';
import type { TripResponse } from '@/services/trips.types';

const VALID_TRANSITIONS: Partial<Record<TripStatus, TripStatus[]>> = {
  [TripStatus.DRAFT]: [TripStatus.OPEN, TripStatus.CANCELLED],
  [TripStatus.OPEN]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
  [TripStatus.CONFIRMED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED],
};

interface TripStatusTransitionProps {
  tripId: string;
  currentStatus: TripStatus;
  onTransitioned: (trip: TripResponse) => void;
  disabledTargets?: TripStatus[];
}

export function TripStatusTransition({
  tripId,
  currentStatus,
  onTransitioned,
  disabledTargets = [],
}: TripStatusTransitionProps) {
  const { t } = useTranslation('trips');
  const [pendingTransition, setPendingTransition] = useState<TripStatus | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const targets = VALID_TRANSITIONS[currentStatus];
  if (!targets?.length) return null;

  function handleButtonClick(target: TripStatus) {
    setPendingTransition(target);
  }

  function handleDialogClose() {
    if (isTransitioning) return;
    setPendingTransition(null);
  }

  async function handleConfirm() {
    if (!pendingTransition) return;
    setIsTransitioning(true);
    try {
      const updated = await transitionTripStatus(tripId, { status: pendingTransition });
      setPendingTransition(null);
      onTransitioned(updated);
    } catch {
      toast.error(t('transitions.error'));
    } finally {
      setIsTransitioning(false);
    }
  }

  const isCancelTarget = pendingTransition === TripStatus.CANCELLED;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <Button
            key={target}
            type="button"
            variant={target === TripStatus.CANCELLED ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleButtonClick(target)}
            disabled={disabledTargets.includes(target)}
            data-testid={`transition-btn-${target}`}
          >
            {t(`transitions.${target}`)}
          </Button>
        ))}
      </div>

      <Dialog
        open={pendingTransition !== null}
        onOpenChange={(open) => !open && handleDialogClose()}
      >
        <DialogPopup>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>{t('transitions.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('transitions.dialogDescription', {
                status: pendingTransition ? t(`transitions.${pendingTransition}`) : '',
              })}
            </DialogDescription>
            {isCancelTarget && (
              <p className="text-sm font-medium text-destructive">
                {t('transitions.cancelWarning')}
              </p>
            )}
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDialogClose}
              disabled={isTransitioning}
            >
              {t('transitions.cancelButton')}
            </Button>
            <Button
              type="button"
              variant={isCancelTarget ? 'destructive' : 'default'}
              size="sm"
              onClick={handleConfirm}
              disabled={isTransitioning}
              data-testid="transition-confirm-btn"
            >
              {t('transitions.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
