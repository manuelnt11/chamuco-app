'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CommandGroupSection, CommandOption } from '@/components/ui/command';
import { InlineCombobox } from '@/components/ui/inline-combobox';
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
  const { myGroups, publicGroups, isLoading } = useGroupPickerSearch(value);

  const filteredMyGroups = myGroups.filter((g) => !excludedIds?.includes(g.id));
  const filteredPublicGroups = publicGroups.filter((g) => !excludedIds?.includes(g.id));

  function handleSelect(item: GroupPickerItem, close: () => void) {
    onChange('');
    onSelect(item);
    close();
  }

  const panelOpen = open && value.length >= 1;

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
      noResultsText={t('form.linkedGroupsNoResults')}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      data-testid={testId}
    >
      {(close) => (
        <>
          {filteredMyGroups.length > 0 && (
            <CommandGroupSection heading={t('form.linkedGroupsMyGroups')}>
              {filteredMyGroups.map((group) => (
                <CommandOption
                  key={group.id}
                  value={group.id}
                  onSelect={() => handleSelect({ ...group, isMyGroup: true }, close)}
                >
                  <GroupItem group={group} />
                </CommandOption>
              ))}
            </CommandGroupSection>
          )}
          {filteredPublicGroups.length > 0 && (
            <CommandGroupSection heading={t('form.linkedGroupsPublicGroups')}>
              {filteredPublicGroups.map((group) => (
                <CommandOption
                  key={group.id}
                  value={group.id}
                  onSelect={() => handleSelect({ ...group, isMyGroup: false }, close)}
                >
                  <GroupItem group={group} />
                </CommandOption>
              ))}
            </CommandGroupSection>
          )}
        </>
      )}
    </InlineCombobox>
  );
}

interface GroupItemProps {
  group: Pick<Group | GroupSearchResult, 'coverUrl' | 'name'>;
}

function GroupItem({ group }: GroupItemProps) {
  return (
    <>
      <div className="size-7 shrink-0 overflow-hidden rounded-md bg-muted">
        {group.coverUrl && (
          <img src={group.coverUrl} alt="" className="size-full object-cover" aria-hidden="true" />
        )}
      </div>
      <span className="truncate font-medium">{group.name}</span>
    </>
  );
}

export { GroupAutocomplete };
export type { GroupAutocompleteProps };
