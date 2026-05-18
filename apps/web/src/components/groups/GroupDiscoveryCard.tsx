'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { JoinRequestButton } from '@/components/groups/members/JoinRequestButton';
import type { GroupSearchResult, MembershipStatus } from '@/types/group';

interface GroupDiscoveryCardProps {
  group: GroupSearchResult;
  currentUserId: string;
  onStatusChange: (groupId: string, newStatus: MembershipStatus) => void;
}

export function GroupDiscoveryCard({
  group,
  currentUserId,
  onStatusChange,
}: GroupDiscoveryCardProps) {
  const { t } = useTranslation('groups');

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <img src={group.coverUrl} alt={group.name} className="size-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{group.name}</p>
        {group.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{group.description}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('search.memberCount', { count: group.memberCount })}
        </p>
      </div>

      <div className="shrink-0">
        {group.membershipStatus === 'active' ? (
          <Link
            href={`/groups/${group.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t('detail.view')}
          </Link>
        ) : (
          <JoinRequestButton
            groupId={group.id}
            userId={currentUserId}
            hasPendingRequest={group.membershipStatus === 'pending'}
            onSuccess={() =>
              onStatusChange(group.id, group.membershipStatus === 'none' ? 'pending' : 'none')
            }
          />
        )}
      </div>
    </div>
  );
}
