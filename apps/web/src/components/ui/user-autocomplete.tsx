'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { CommandOption } from '@/components/ui/command';
import { InlineCombobox } from '@/components/ui/inline-combobox';
import { useUserSearch } from '@/hooks/useUserSearch';
import type { UserSearchResult } from '@/types/user';

interface UserAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function UserAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}: UserAutocompleteProps) {
  const { t } = useTranslation('groups');
  const [open, setOpen] = useState(false);
  const { results, isLoading } = useUserSearch(value);

  function handleSelect(user: UserSearchResult, close: () => void) {
    onChange('');
    onSelect(user);
    close();
  }

  const panelOpen = open && value.length >= 1 && (value !== '@' || isLoading || results.length > 0);

  return (
    <InlineCombobox
      value={value}
      onValueChange={(v) => {
        onChange(v);
        setOpen(v.length >= 1);
      }}
      open={panelOpen}
      onFocus={() => {
        if (value.length >= 1) setOpen(true);
      }}
      onClose={() => setOpen(false)}
      isLoading={isLoading}
      noResultsText={t('members.invite.noResults')}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid}
      data-testid={testId}
    >
      {(close) =>
        results.map((user) => (
          <CommandOption key={user.id} value={user.id} onSelect={() => handleSelect(user, close)}>
            <Avatar
              src={user.avatar?.url}
              alt=""
              fallback={user.displayName.charAt(0).toUpperCase()}
              size="sm"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
            </span>
          </CommandOption>
        ))
      }
    </InlineCombobox>
  );
}

export { UserAutocomplete };
export type { UserAutocompleteProps };
