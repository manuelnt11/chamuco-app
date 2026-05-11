'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { apiClient } from '@/services/api-client';
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

interface LeaveGroupButtonProps {
  groupId: string;
  userId: string;
}

export function LeaveGroupButton({ groupId, userId }: LeaveGroupButtonProps) {
  const { t } = useTranslation('groups');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLeaving(true);
    setError(null);
    try {
      await apiClient.delete(`/v1/groups/${groupId}/members/${userId}`);
      setOpen(false);
      router.push('/groups');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? t('members.leave.lastAdmin')
          : t('members.leave.error');
      setError(message);
      setIsLeaving(false);
    }
  };

  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!isLeaving) setOpen(newOpen);
        }}
      >
        <DialogTrigger
          render={
            <Button variant="destructive" size="sm">
              {t('members.leave.button')}
            </Button>
          }
        />
        <DialogPopup>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>{t('members.leave.button')}</DialogTitle>
            <DialogDescription>{t('members.leave.confirm')}</DialogDescription>
          </DialogHeader>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-4">
            <DialogClose
              render={
                <Button variant="outline" size="sm" disabled={isLeaving}>
                  {t('members.leave.cancel')}
                </Button>
              }
            />
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={isLeaving}>
              {isLeaving ? t('members.leave.leaving') : t('members.leave.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
