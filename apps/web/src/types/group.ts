import type {
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
} from '@chamuco/shared-types';

export type {
  Group,
  GroupSearchResult,
  GroupSearchResponse,
  MembershipStatus,
} from '@chamuco/shared-types';

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

export interface GroupInvitation {
  group: {
    id: string;
    name: string;
    coverUrl: string;
  };
  initiatedAt: string;
}

export interface MyGroupJoinRequest {
  groupId: string;
  name: string;
  coverUrl: string | null;
  visibility: GroupVisibility;
  initiatedAt: string;
}

export interface GroupAnnouncement {
  id: string;
  groupId: string;
  createdByUsername: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupAnnouncementsResponse {
  items: GroupAnnouncement[];
  total: number;
}
