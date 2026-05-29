import type {
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
  MembershipStatus,
} from '@chamuco/shared-types';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string;
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

export interface GroupInvitation {
  group: {
    id: string;
    name: string;
    coverUrl: string;
  };
  initiatedAt: string;
}

export type { MembershipStatus };

export interface GroupSearchResult extends Group {
  memberCount: number;
  membershipStatus: MembershipStatus;
}

export interface GroupSearchResponse {
  data: GroupSearchResult[];
  total: number;
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
