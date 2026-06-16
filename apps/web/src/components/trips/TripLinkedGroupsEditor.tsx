'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@phosphor-icons/react';

import { toast } from '@/components/ui/toast';
import { GroupAutocomplete, type GroupPickerItem } from '@/components/ui/group-autocomplete';
import { getTripLinkedGroups, addTripGroup, removeTripGroup } from '@/services/trips.service';
import type { TripLinkedGroup } from '@/services/trips.types';

interface TripLinkedGroupsEditorProps {
  tripId: string;
}

export function TripLinkedGroupsEditor({ tripId }: TripLinkedGroupsEditorProps) {
  const { t } = useTranslation('trips');
  const [groups, setGroups] = useState<TripLinkedGroup[]>([]);
  const [groupSearchInput, setGroupSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTripLinkedGroups(tripId)
      .then(setGroups)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [tripId]);

  async function handleAdd(group: GroupPickerItem) {
    if (groups.some((g) => g.id === group.id)) return;
    try {
      await addTripGroup(tripId, { groupId: group.id });
      setGroups((prev) => [...prev, { id: group.id, name: group.name, coverUrl: group.coverUrl }]);
    } catch {
      toast.error(t('settings.linkedGroupAddFailed'));
    }
  }

  async function handleRemove(groupId: string) {
    try {
      await removeTripGroup(tripId, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch {
      toast.error(t('settings.linkedGroupRemoveFailed'));
    }
  }

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('settings.linkedGroups')}</p>

      {groups.length > 0 && (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                {group.coverUrl && (
                  <img
                    src={group.coverUrl}
                    alt=""
                    className="size-full object-cover"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium">{group.name}</span>
              <button
                type="button"
                onClick={() => void handleRemove(group.id)}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                title={t('settings.linkedGroupRemove', { name: group.name })}
                aria-label={t('settings.linkedGroupRemove', { name: group.name })}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <GroupAutocomplete
        value={groupSearchInput}
        onChange={setGroupSearchInput}
        onSelect={(group) => {
          void handleAdd(group);
          setGroupSearchInput('');
        }}
        excludedIds={groups.map((g) => g.id)}
        placeholder={t('form.linkedGroupsPlaceholder')}
      />
    </div>
  );
}
