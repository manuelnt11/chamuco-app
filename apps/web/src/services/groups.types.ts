import type { GroupMemberStatus, GroupRole, GroupVisibility } from '@chamuco/shared-types';

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreateGroupPayload {
  name: string;
  description?: string;
  visibility: GroupVisibility;
  cover: { source: 'emoji'; target: string };
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  visibility?: GroupVisibility;
  cover?: { source: 'emoji' | 'gcs'; target: string; fileSize?: number };
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface GroupMembershipResponse {
  status: GroupMemberStatus;
  role: GroupRole;
}

export type InvitationResultStatus =
  | 'INVITED'
  | 'ALREADY_MEMBER'
  | 'ALREADY_INVITED'
  | 'HAS_PENDING_REQUEST'
  | 'NOT_FOUND';

export interface InvitationResult {
  username: string;
  status: InvitationResultStatus;
}

export interface InviteGroupMembersResponse {
  results: InvitationResult[];
}
