'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';

import { getGroups } from '@/services/groups.service';
import { useAuth } from '@/hooks/useAuth';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupInvitationsSection } from '@/components/groups/GroupInvitationsSection';
import { GroupJoinRequestsSection } from '@/components/groups/GroupJoinRequestsSection';
import type { Group } from '@/types/group';

export default function GroupsPage() {
  const { t } = useTranslation(['groups', 'common']);
  const { isLoading: isAuthLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = () => {
    getGroups()
      .then((groups) => setGroups(groups))
      .catch(() => setGroups([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isAuthLoading) return;
    fetchGroups();
  }, [isAuthLoading]);

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/explore/groups"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
            title={t('common:actions.search')}
            aria-label={t('common:actions.search')}
          >
            <MagnifyingGlassIcon className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/groups/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
            title={t('common:actions.create')}
            aria-label={t('common:actions.create')}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {isLoading ? null : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mb-6">
          <p className="text-lg font-medium text-foreground">{t('detail.noGroups')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('detail.createFirst')}</p>
          <Link
            href="/groups/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('common:actions.create')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <GroupInvitationsSection />
      <GroupJoinRequestsSection />
    </div>
  );
}
