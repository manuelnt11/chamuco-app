'use client';

import { useTranslation } from 'react-i18next';
import { GroupMemberStatus } from '@chamuco/shared-types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import type { PendingGroupMember } from '@/types/group';

interface PendingRequestsPanelProps {
  groupId: string;
  items: PendingGroupMember[];
  onUpdate: () => void;
}

export function PendingRequestsPanel({ groupId, items, onUpdate }: PendingRequestsPanelProps) {
  const { t } = useTranslation('groups');

  const handleAccept = async (userId: string) => {
    await apiClient.patch(`/v1/groups/${groupId}/join-requests/${userId}/accept`);
    onUpdate();
  };

  const handleReject = async (userId: string) => {
    await apiClient.patch(`/v1/groups/${groupId}/join-requests/${userId}/reject`);
    onUpdate();
  };

  const handleRevoke = async (userId: string) => {
    await apiClient.delete(`/v1/groups/${groupId}/invitations/${userId}`);
    onUpdate();
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-semibold mb-3">{t('members.pending.title', { count: 0 })}</p>
        <p className="text-sm text-muted-foreground">{t('members.pending.noItems')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-semibold mb-3">
        {t('members.pending.title', { count: items.length })}
      </p>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const initials = item.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <li key={item.userId} className="flex items-center gap-3 py-3">
              <Avatar
                src={item.avatarUrl ?? undefined}
                alt={item.displayName}
                fallback={initials}
                size="sm"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">@{item.username}</p>
              </div>

              <Badge variant="outline" className="shrink-0">
                {item.status === GroupMemberStatus.REQUEST
                  ? t('members.pending.statusRequest')
                  : t('members.pending.statusInvited')}
              </Badge>

              <div className="flex shrink-0 gap-1.5">
                {item.status === GroupMemberStatus.REQUEST ? (
                  <>
                    <Button size="xs" onClick={() => handleAccept(item.userId)}>
                      {t('members.pending.accept')}
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleReject(item.userId)}
                    >
                      {t('members.pending.reject')}
                    </Button>
                  </>
                ) : (
                  <Button size="xs" variant="destructive" onClick={() => handleRevoke(item.userId)}>
                    {t('members.pending.revoke')}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
