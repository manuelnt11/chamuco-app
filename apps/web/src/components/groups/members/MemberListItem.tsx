'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import { ShieldStarIcon, UserMinusIcon } from '@phosphor-icons/react';
import { getInitials } from '@/lib/name-utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteConfirmButton } from '@/components/ui/delete-confirm-button';
import { toast } from '@/components/ui/toast';
import { removeGroupMember, updateMemberRole } from '@/services/groups.service';
import type { GroupMember } from '@/types/group';

interface MemberListItemProps {
  member: GroupMember;
  groupId: string;
  currentUserId: string | null;
  currentUserRole: GroupRole | null;
  onActionSuccess: () => void;
}

const ROLE_VARIANT: Record<GroupRole, 'default' | 'secondary' | 'outline'> = {
  [GroupRole.OWNER]: 'default',
  [GroupRole.ADMIN]: 'secondary',
  [GroupRole.MEMBER]: 'outline',
};

const TIER_VARIANT: Record<GroupMemberTier, 'default' | 'secondary' | 'outline'> = {
  [GroupMemberTier.VETERAN]: 'default',
  [GroupMemberTier.EXPLORER]: 'secondary',
  [GroupMemberTier.NOVICE]: 'secondary',
  [GroupMemberTier.NEWCOMER]: 'outline',
};

const ADMIN_ROLES: GroupRole[] = [GroupRole.OWNER, GroupRole.ADMIN];

export function MemberListItem({
  member,
  groupId,
  currentUserId,
  currentUserRole,
  onActionSuccess,
}: MemberListItemProps) {
  const { t } = useTranslation('groups');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);

  const isAdmin = currentUserRole !== null && ADMIN_ROLES.includes(currentUserRole);
  const isSelf = member.userId === currentUserId;
  const isTargetOwner = member.role === GroupRole.OWNER;
  const callerIsOwner = currentUserRole === GroupRole.OWNER;

  const canActOnTarget = !isTargetOwner || callerIsOwner;
  const showActions = isAdmin && !isSelf && canActOnTarget;

  const showPromote = showActions && member.role === GroupRole.MEMBER;
  const showDemote = showActions && member.role === GroupRole.ADMIN;

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await removeGroupMember(groupId, member.userId);
      onActionSuccess();
    } catch {
      toast.error(t('members.actions.removeError'));
    } finally {
      setIsRemoving(false);
    }
  }

  async function handlePromote() {
    setIsPromoting(true);
    try {
      await updateMemberRole(groupId, member.userId, GroupRole.ADMIN);
      onActionSuccess();
    } catch {
      toast.error(t('members.actions.promoteError'));
    } finally {
      setIsPromoting(false);
    }
  }

  async function handleDemote() {
    setIsDemoting(true);
    try {
      await updateMemberRole(groupId, member.userId, GroupRole.MEMBER);
      onActionSuccess();
    } catch {
      toast.error(t('members.actions.demoteError'));
    } finally {
      setIsDemoting(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-3 sm:items-center">
      <Avatar
        src={member.avatarUrl ?? undefined}
        alt={member.displayName}
        fallback={getInitials(member.displayName)}
        size="md"
        className="mt-0.5 sm:mt-0"
      />

      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{member.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 mt-1.5 sm:mt-0 sm:flex-nowrap sm:shrink-0">
          <Badge variant={ROLE_VARIANT[member.role]}>{t(`members.role.${member.role}`)}</Badge>
          <Badge variant={TIER_VARIANT[member.tier]}>{t(`members.tier.${member.tier}`)}</Badge>

          {showActions && (
            <div className="flex gap-1 ml-auto sm:ml-0.5 shrink-0">
              {showPromote && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void handlePromote()}
                  disabled={isPromoting}
                  title={t('members.actions.promote')}
                  aria-label={t('members.actions.promote')}
                >
                  <ShieldStarIcon aria-hidden="true" />
                </Button>
              )}
              {showDemote && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void handleDemote()}
                  disabled={isDemoting}
                  title={t('members.actions.demote')}
                  aria-label={t('members.actions.demote')}
                >
                  <UserMinusIcon aria-hidden="true" />
                </Button>
              )}
              <DeleteConfirmButton onDelete={handleRemove} disabled={isRemoving} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
