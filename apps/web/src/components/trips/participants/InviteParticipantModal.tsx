'use client';

import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlusIcon } from '@phosphor-icons/react';
import type { InvitationResult } from '@chamuco/shared-types';
import { inviteTripParticipants } from '@/services/trips.service';
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

interface InviteParticipantModalProps {
  tripId: string;
  onSuccess: () => void;
  excludedIds?: string[];
  disabled?: boolean;
}

export function InviteParticipantModal({
  tripId,
  onSuccess,
  excludedIds,
  disabled = false,
}: InviteParticipantModalProps) {
  const { t } = useTranslation('trips');
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
      setSelectionError(t('participants.invite.alreadyExcluded'));
      return;
    }
    if (selectedUsers.length >= 20) {
      setSelectionError(t('participants.invite.maxUsers'));
      return;
    }
    setSelectionError(null);
    setSelectedUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
  }

  function removeUser(id: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectionError(null);
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await inviteTripParticipants(tripId, {
        usernames: selectedUsers.map((u) => u.username),
      });
      setResults(res.results);
    } catch {
      setError(t('participants.invite.error'));
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
          <Button variant="outline" size="sm" disabled={disabled}>
            <UserPlusIcon />
            {t('participants.invite.button')}
          </Button>
        }
      />

      <DialogPopup className="p-6">
        <DialogTitle>
          {results ? t('participants.invite.results.title') : t('participants.invite.title')}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {results ? t('participants.invite.results.title') : t('participants.invite.title')}
        </DialogDescription>

        {results ? (
          <div className="mt-4 space-y-4">
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.username} className="flex items-center justify-between text-sm">
                  <span className="font-medium">@{r.username}</span>
                  <span className="text-muted-foreground">
                    {t(`participants.invite.result.${r.status}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={handleDone}>
                {t('participants.invite.done')}
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
                      aria-label={t('participants.invite.removeUser', { username: u.username })}
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
              placeholder={t('participants.invite.usernamePlaceholder')}
            />

            {selectionError && <p className="text-sm text-destructive">{selectionError}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <DialogClose
                render={
                  <Button variant="outline" size="sm" type="button">
                    {t('participants.invite.cancel')}
                  </Button>
                }
              />
              <Button size="sm" type="submit" disabled={isSending || selectedUsers.length === 0}>
                {isSending ? t('participants.invite.sending') : t('participants.invite.submit')}
              </Button>
            </div>
          </form>
        )}
      </DialogPopup>
    </Dialog>
  );
}
