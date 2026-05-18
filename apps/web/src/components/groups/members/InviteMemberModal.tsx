'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlusIcon } from '@phosphor-icons/react';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

interface InviteMemberModalProps {
  groupId: string;
  onSuccess: () => void;
}

export function InviteMemberModal({ groupId, onSuccess }: InviteMemberModalProps) {
  const { t } = useTranslation('groups');
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      await apiClient.post(`/v1/groups/${groupId}/invitations`, {
        targetUsername: username.trim(),
      });
      setOpen(false);
      setUsername('');
      onSuccess();
    } catch {
      setError(t('members.invite.error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlusIcon />
            {t('members.invite.button')}
          </Button>
        }
      />

      <DialogPopup className="p-6">
        <DialogTitle>{t('members.invite.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('members.invite.title')}</DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('members.invite.usernamePlaceholder')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
            spellCheck={false}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <DialogClose
              render={
                <Button variant="outline" size="sm" type="button">
                  {t('members.invite.cancel', { ns: 'groups' })}
                </Button>
              }
            />
            <Button size="sm" type="submit" disabled={isSending || !username.trim()}>
              {isSending ? t('members.invite.sending') : t('members.invite.submit')}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
