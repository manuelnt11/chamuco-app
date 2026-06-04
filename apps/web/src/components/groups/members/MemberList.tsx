'use client';

import { useTranslation } from 'react-i18next';
import { GroupRole } from '@chamuco/shared-types';
import { MemberListItem } from './MemberListItem';
import { InviteMemberModal } from './InviteMemberModal';
import type { GroupMember } from '@/types/group';

interface MemberListProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string | null;
  currentUserRole: GroupRole | null;
  onInviteSuccess: () => void;
  onMemberAction: () => void;
  excludedIds?: string[];
}

const ADMIN_ROLES: GroupRole[] = [GroupRole.OWNER, GroupRole.ADMIN];

export function MemberList({
  groupId,
  members,
  currentUserId,
  currentUserRole,
  onInviteSuccess,
  onMemberAction,
  excludedIds,
}: MemberListProps) {
  const { t } = useTranslation('groups');
  const isAdmin = currentUserRole !== null && ADMIN_ROLES.includes(currentUserRole);

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-sm font-semibold">
          {t('members.title')} ({members.length})
        </p>
        {isAdmin && (
          <InviteMemberModal
            groupId={groupId}
            onSuccess={onInviteSuccess}
            excludedIds={excludedIds}
          />
        )}
      </div>

      {members.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">{t('members.empty')}</p>
      ) : (
        <ul className="divide-y divide-border px-4">
          {members.map((member) => (
            <MemberListItem
              key={member.userId}
              member={member}
              groupId={groupId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onActionSuccess={onMemberAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
