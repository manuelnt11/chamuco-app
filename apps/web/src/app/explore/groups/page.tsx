'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupDiscoveryCard } from '@/components/groups/GroupDiscoveryCard';
import { useGroupSearch } from '@/hooks/useGroupSearch';
import { useUser } from '@/hooks/useUser';
import type { MembershipStatus, GroupSearchResult } from '@/types/group';

export default function ExploreGroupsPage() {
  const { t } = useTranslation('groups');
  const { appUser } = useUser();
  const [query, setQuery] = useState('');

  const { results: fetchedResults, total, isLoading } = useGroupSearch(query);

  // Track local status overrides after join/withdraw actions
  const [statusOverrides, setStatusOverrides] = useState<Map<string, MembershipStatus>>(new Map());

  const handleStatusChange = (groupId: string, newStatus: MembershipStatus) => {
    setStatusOverrides((prev) => new Map(prev).set(groupId, newStatus));
  };

  const results: GroupSearchResult[] = fetchedResults.map((group) => ({
    ...group,
    membershipStatus: statusOverrides.get(group.id) ?? group.membershipStatus,
  }));

  const isEmpty = !query.trim();
  const noResults = !isEmpty && !isLoading && results.length === 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t('search.pageTitle')}</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
        aria-label={t('search.placeholder')}
      />

      {isLoading && <p className="text-sm text-muted-foreground">{t('search.loading')}</p>}

      {isEmpty && !isLoading && (
        <p className="text-sm text-muted-foreground">{t('search.empty')}</p>
      )}

      {noResults && (
        <p className="text-sm text-muted-foreground">{t('search.noResults', { query })}</p>
      )}

      {!isEmpty && !isLoading && results.length > 0 && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {t('search.resultCount', { count: total })}
          </p>
          <div className="flex flex-col gap-3">
            {results.map((group) => (
              <GroupDiscoveryCard
                key={group.id}
                group={group}
                currentUserId={appUser?.id ?? ''}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
