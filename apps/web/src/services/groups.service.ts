import { apiClient } from '@/services/api-client';
import type {
  CreateGroupPayload,
  GroupMembershipResponse,
  UpdateGroupPayload,
} from '@/services/groups.types';
import type { BulkInvitationResponse, GroupRole } from '@chamuco/shared-types';
import type {
  Group,
  GroupAnnouncement,
  GroupAnnouncementsResponse,
  GroupInvitation,
  GroupMember,
  GroupSearchResponse,
  PendingGroupMember,
} from '@/types/group';

// ─── Group methods ────────────────────────────────────────────────────────────

export async function getGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>('/v1/groups');
  return data;
}

export async function getGroup(id: string): Promise<Group> {
  const { data } = await apiClient.get<Group>(`/v1/groups/${id}`);
  return data;
}

export async function createGroup(dto: CreateGroupPayload): Promise<Group> {
  const { data } = await apiClient.post<Group>('/v1/groups', dto);
  return data;
}

export async function updateGroup(id: string, dto: UpdateGroupPayload): Promise<Group> {
  const { data } = await apiClient.patch<Group>(`/v1/groups/${id}`, dto);
  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  await apiClient.delete(`/v1/groups/${id}`);
}

// ─── Member methods ───────────────────────────────────────────────────────────

export async function getGroupMembers(id: string): Promise<GroupMember[]> {
  const { data } = await apiClient.get<GroupMember[]>(`/v1/groups/${id}/members`);
  return data;
}

export async function getGroupMembership(id: string): Promise<GroupMembershipResponse> {
  const { data } = await apiClient.get<GroupMembershipResponse>(`/v1/groups/${id}/members/me`);
  return data;
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: GroupRole,
): Promise<void> {
  await apiClient.patch(`/v1/groups/${groupId}/members/${userId}/role`, { role });
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/groups/${groupId}/members/${userId}`);
}

export async function joinGroup(groupId: string): Promise<void> {
  await apiClient.post(`/v1/groups/${groupId}/join-request`);
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/groups/${groupId}/members/${userId}`);
}

// ─── Join request methods ─────────────────────────────────────────────────────

export async function acceptJoinRequest(groupId: string, userId: string): Promise<void> {
  await apiClient.patch(`/v1/groups/${groupId}/join-requests/${userId}/accept`);
}

export async function rejectJoinRequest(groupId: string, userId: string): Promise<void> {
  await apiClient.patch(`/v1/groups/${groupId}/join-requests/${userId}/reject`);
}

// ─── Invitation methods ───────────────────────────────────────────────────────

export async function getMyGroupInvitations(): Promise<GroupInvitation[]> {
  const { data } = await apiClient.get<GroupInvitation[]>('/v1/groups/invitations');
  return data;
}

export async function inviteGroupMembers(
  groupId: string,
  dto: { usernames: string[] },
): Promise<BulkInvitationResponse> {
  const { data } = await apiClient.post<BulkInvitationResponse>(
    `/v1/groups/${groupId}/invitations`,
    dto,
  );
  return data;
}

export async function acceptGroupInvitation(groupId: string): Promise<void> {
  await apiClient.patch(`/v1/groups/${groupId}/invitations/accept`);
}

export async function declineGroupInvitation(groupId: string): Promise<void> {
  await apiClient.patch(`/v1/groups/${groupId}/invitations/decline`);
}

export async function cancelGroupInvitation(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/groups/${groupId}/invitations/${userId}`);
}

// ─── Announcement methods ─────────────────────────────────────────────────────

export async function getGroupAnnouncements(
  groupId: string,
  limit: number,
  offset: number,
): Promise<GroupAnnouncementsResponse> {
  const { data } = await apiClient.get<GroupAnnouncementsResponse>(
    `/v1/groups/${groupId}/announcements`,
    { params: { limit, offset } },
  );
  return data;
}

export async function getGroupAnnouncement(
  groupId: string,
  announcementId: string,
): Promise<GroupAnnouncement> {
  const { data } = await apiClient.get<GroupAnnouncement>(
    `/v1/groups/${groupId}/announcements/${announcementId}`,
  );
  return data;
}

export async function createAnnouncement(
  groupId: string,
  dto: { content: string },
): Promise<GroupAnnouncement> {
  const { data } = await apiClient.post<GroupAnnouncement>(
    `/v1/groups/${groupId}/announcements`,
    dto,
  );
  return data;
}

export async function updateAnnouncement(
  groupId: string,
  announcementId: string,
  dto: { content: string },
): Promise<GroupAnnouncement> {
  const { data } = await apiClient.patch<GroupAnnouncement>(
    `/v1/groups/${groupId}/announcements/${announcementId}`,
    dto,
  );
  return data;
}

export async function deleteAnnouncement(groupId: string, announcementId: string): Promise<void> {
  await apiClient.delete(`/v1/groups/${groupId}/announcements/${announcementId}`);
}

// ─── Pending members ──────────────────────────────────────────────────────────

export async function getPendingGroupMembers(groupId: string): Promise<PendingGroupMember[]> {
  const { data } = await apiClient.get<PendingGroupMember[]>(`/v1/groups/${groupId}/pending`);
  return data;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchGroups(
  params: { q: string; limit?: number; offset?: number },
  signal?: AbortSignal,
): Promise<GroupSearchResponse> {
  const { data } = await apiClient.get<GroupSearchResponse>('/v1/groups/search', {
    params,
    signal,
  });
  return data;
}
