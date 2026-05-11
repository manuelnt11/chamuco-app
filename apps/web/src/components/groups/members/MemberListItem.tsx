'use client';

import { useTranslation } from 'react-i18next';
import { GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { GroupMember } from '@/types/group';

interface MemberListItemProps {
  member: GroupMember;
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

export function MemberListItem({ member }: MemberListItemProps) {
  const { t } = useTranslation('groups');
  const initials = member.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar
        src={member.avatarUrl ?? undefined}
        alt={member.displayName}
        fallback={initials}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <Badge variant={ROLE_VARIANT[member.role]}>{t(`members.role.${member.role}`)}</Badge>
        <Badge variant={TIER_VARIANT[member.tier]}>{t(`members.tier.${member.tier}`)}</Badge>
      </div>
    </li>
  );
}
