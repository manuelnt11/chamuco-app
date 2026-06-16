'use client';

import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useGroupPickerSearch } from '@/hooks/useGroupPickerSearch';
import type { Group, GroupSearchResult } from '@/types/group';

export type GroupPickerItem = (Group | GroupSearchResult) & { isMyGroup: boolean };

interface GroupAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (group: GroupPickerItem) => void;
  excludedIds?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

function GroupAutocomplete({
  value,
  onChange,
  onSelect,
  excludedIds,
  placeholder,
  className,
  disabled,
  'data-testid': testId,
}: GroupAutocompleteProps) {
  const { t } = useTranslation('trips');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { myGroups, publicGroups, isLoading } = useGroupPickerSearch(value);

  const filteredMyGroups = myGroups.filter((g) => !excludedIds?.includes(g.id));
  const filteredPublicGroups = publicGroups.filter((g) => !excludedIds?.includes(g.id));

  const hasMyGroups = filteredMyGroups.length > 0;
  const hasPublicGroups = filteredPublicGroups.length > 0;
  const hasResults = hasMyGroups || hasPublicGroups;

  const flatItems: GroupPickerItem[] = [
    ...filteredMyGroups.map((g) => ({ ...g, isMyGroup: true as const })),
    ...filteredPublicGroups.map((g) => ({ ...g, isMyGroup: false as const })),
  ];

  const showDropdown = open && value.length >= 1 && (isLoading || hasResults);
  const showEmpty = open && value.length >= 1 && !isLoading && !hasResults;

  function handleSelect(item: GroupPickerItem) {
    onChange('');
    onSelect(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      handleSelect(flatItems[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  let itemOffset = 0;

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
        disabled={disabled}
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
              {t('form.linkedGroupsNoResults')}
            </p>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {hasMyGroups && (
                <>
                  <li className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('form.linkedGroupsMyGroups')}
                  </li>
                  {filteredMyGroups.map((group) => {
                    const idx = itemOffset++;
                    return (
                      <GroupItem
                        key={group.id}
                        group={{ ...group, isMyGroup: true }}
                        isActive={idx === activeIndex}
                        onMouseDown={() => handleSelect({ ...group, isMyGroup: true })}
                      />
                    );
                  })}
                </>
              )}
              {hasPublicGroups && (
                <>
                  <li className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('form.linkedGroupsPublicGroups')}
                  </li>
                  {filteredPublicGroups.map((group) => {
                    const idx = itemOffset++;
                    return (
                      <GroupItem
                        key={group.id}
                        group={{ ...group, isMyGroup: false }}
                        isActive={idx === activeIndex}
                        onMouseDown={() => handleSelect({ ...group, isMyGroup: false })}
                      />
                    );
                  })}
                </>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface GroupItemProps {
  group: GroupPickerItem;
  isActive: boolean;
  onMouseDown: () => void;
}

function GroupItem({ group, isActive, onMouseDown }: GroupItemProps) {
  return (
    <li>
      <button
        type="button"
        data-active={isActive}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted data-[active=true]:bg-muted"
        onMouseDown={(e) => {
          e.preventDefault();
          onMouseDown();
        }}
      >
        <div className="size-7 shrink-0 overflow-hidden rounded-md bg-muted">
          {group.coverUrl && (
            <img
              src={group.coverUrl}
              alt=""
              className="size-full object-cover"
              aria-hidden="true"
            />
          )}
        </div>
        <span className="truncate font-medium">{group.name}</span>
      </button>
    </li>
  );
}

export { GroupAutocomplete };
export type { GroupAutocompleteProps };
