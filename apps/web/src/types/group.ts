import type {
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
  ResolvedAsset,
} from '@chamuco/shared-types';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover: ResolvedAsset;
  visibility: GroupVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: GroupRole;
  tier: GroupMemberTier;
  joinedAt: string;
}

export interface PendingGroupMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: GroupMemberStatus.REQUEST | GroupMemberStatus.INVITED;
  initiatedAt: string;
}
