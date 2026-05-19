'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useUserSearch } from '@/hooks/useUserSearch';
import type { UserSearchResult } from '@/types/user';

interface UserAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function UserAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}: UserAutocompleteProps) {
  const { t } = useTranslation('groups');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { results, isLoading } = useUserSearch(value);

  const showDropdown =
    open && value.length >= 1 && (isLoading || results.length > 0 || (!isLoading && value !== '@'));
  const showEmpty =
    open && value.length >= 1 && value !== '@' && !isLoading && results.length === 0;

  function handleSelect(user: UserSearchResult) {
    onChange('');
    onSelect(user);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
          setOpen(e.target.value.length >= 1);
        }}
        onFocus={() => {
          if (value.length >= 1) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        data-testid={testId}
        autoComplete="off"
        spellCheck={false}
        className={cn(className)}
      />

      {(showDropdown || showEmpty) && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center p-3">
              <Spinner size="sm" />
            </div>
          ) : showEmpty ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t('members.invite.noResults')}
            </p>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    data-active={index === activeIndex}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted data-[active=true]:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(user);
                    }}
                  >
                    <Avatar
                      src={user.avatar?.url}
                      alt=""
                      fallback={user.displayName.charAt(0).toUpperCase()}
                      size="sm"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{user.displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export { UserAutocomplete };
export type { UserAutocompleteProps };
