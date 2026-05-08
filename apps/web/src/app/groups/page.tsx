'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { apiClient } from '@/services/api-client';
import { GroupCard } from '@/components/groups/GroupCard';
import type { Group } from '@/types/group';

export default function GroupsPage() {
  const { t } = useTranslation('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Group[]>('/v1/groups')
      .then((res) => setGroups(res.data))
      .catch(() => setGroups([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Link
          href="/groups/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('createGroup')}
        </Link>
      </div>

      {isLoading ? null : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">{t('detail.noGroups')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('detail.createFirst')}</p>
          <Link
            href="/groups/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('createGroup')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
