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
import { UserAutocomplete } from '@/components/ui/user-autocomplete';
import type { UserSearchResult } from '@/types/user';

type InvitationResultStatus =
  | 'INVITED'
  | 'ALREADY_MEMBER'
  | 'ALREADY_INVITED'
  | 'HAS_PENDING_REQUEST'
  | 'NOT_FOUND';

interface InvitationResult {
  username: string;
  status: InvitationResultStatus;
}

interface InviteMemberModalProps {
  groupId: string;
  onSuccess: () => void;
  excludedIds?: string[];
}

export function InviteMemberModal({ groupId, onSuccess, excludedIds }: InviteMemberModalProps) {
  const { t } = useTranslation('groups');
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [results, setResults] = useState<InvitationResult[] | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setInputValue('');
      setSelectedUsers([]);
      setError(null);
      setSelectionError(null);
      setResults(null);
    }
  }

  function addUser(user: UserSearchResult) {
    if (excludedIds?.includes(user.id)) {
      setSelectionError(t('members.invite.alreadyExcluded'));
      return;
    }
    setSelectionError(null);
    setSelectedUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
  }

  function removeUser(id: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await apiClient.post<{ results: InvitationResult[] }>(
        `/v1/groups/${groupId}/invitations`,
        { usernames: selectedUsers.map((u) => u.username) },
      );
      setResults(res.data.results);
    } catch {
      setError(t('members.invite.error'));
    } finally {
      setIsSending(false);
    }
  };

  function handleDone() {
    const anyInvited = results?.some((r) => r.status === 'INVITED') ?? false;
    handleOpenChange(false);
    if (anyInvited) onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        {results ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium">{t('members.invite.results.title')}</p>
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.username} className="flex items-center justify-between text-sm">
                  <span className="font-medium">@{r.username}</span>
                  <span className="text-muted-foreground">
                    {t(`members.invite.result.${r.status}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={handleDone}>
                {t('members.invite.done')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    @{u.username}
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="ml-1 rounded-full hover:text-destructive"
                      aria-label={t('members.invite.removeUser', { username: u.username })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <UserAutocomplete
              value={inputValue}
              onChange={setInputValue}
              onSelect={addUser}
              placeholder={t('members.invite.usernamePlaceholder')}
            />

            {selectionError && <p className="text-sm text-destructive">{selectionError}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <DialogClose
                render={
                  <Button variant="outline" size="sm" type="button">
                    {t('members.invite.cancel', { ns: 'groups' })}
                  </Button>
                }
              />
              <Button size="sm" type="submit" disabled={isSending || selectedUsers.length === 0}>
                {isSending ? t('members.invite.sending') : t('members.invite.submit')}
              </Button>
            </div>
          </form>
        )}
      </DialogPopup>
    </Dialog>
  );
}
