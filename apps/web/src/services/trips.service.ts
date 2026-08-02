import type { BulkInvitationResponse, ExportField, ExportFormat } from '@chamuco/shared-types';

import { apiClient } from '@/services/api-client';

import type {
  AddTripGroupPayload,
  CreateDestinationPayload,
  CreateTripInvitationPayload,
  CreateTripPayload,
  CreateTripTaskPayload,
  DestinationResponse,
  DestinationWriteResponse,
  MyTripInvitationResponse,
  MyTripListItemResponse,
  MyTripParticipationResponse,
  PendingTripParticipantResponse,
  ReorderDestinationsPayload,
  SearchTripsParams,
  SetTripTaskCompletionPayload,
  TransitionTripStatusPayload,
  TripAnnouncement,
  TripAnnouncementPayload,
  TripAnnouncementsResponse,
  TripGroupResponse,
  TripLinkedGroup,
  TripParticipantResponse,
  TripResponse,
  TripSearchResponse,
  TripTask,
  UpdateDestinationPayload,
  UpdateParticipantRolePayload,
  UpdateTripPayload,
  UpdateTripTaskPayload,
} from '@/services/trips.types';

// ─── Discovery methods ────────────────────────────────────────────────────────

export async function searchTrips(
  params: SearchTripsParams,
  signal?: AbortSignal,
): Promise<TripSearchResponse> {
  const { data } = await apiClient.get<TripSearchResponse>('/v1/trips/search', {
    params,
    signal,
  });
  return data;
}

// ─── List methods ─────────────────────────────────────────────────────────────

export async function getMyTrips(): Promise<MyTripListItemResponse[]> {
  const { data } = await apiClient.get<MyTripListItemResponse[]>('/v1/trips');
  return data;
}

// ─── Trip methods ─────────────────────────────────────────────────────────────

export async function createTrip(dto: CreateTripPayload): Promise<TripResponse> {
  const { data } = await apiClient.post<TripResponse>('/v1/trips', dto);
  return data;
}

export async function getTrip(id: string): Promise<TripResponse> {
  const { data } = await apiClient.get<TripResponse>(`/v1/trips/${id}`);
  return data;
}

export async function updateTrip(id: string, dto: UpdateTripPayload): Promise<TripResponse> {
  const { data } = await apiClient.patch<TripResponse>(`/v1/trips/${id}`, dto);
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}`);
}

export async function transitionTripStatus(
  id: string,
  dto: TransitionTripStatusPayload,
): Promise<TripResponse> {
  const { data } = await apiClient.patch<TripResponse>(`/v1/trips/${id}/status`, dto);
  return data;
}

export async function getTripParticipation(id: string): Promise<MyTripParticipationResponse> {
  const { data } = await apiClient.get<MyTripParticipationResponse>(
    `/v1/trips/${id}/participants/me`,
  );
  return data;
}

// ─── Destination methods ──────────────────────────────────────────────────────

export async function getTripDestinations(id: string): Promise<DestinationResponse[]> {
  const { data } = await apiClient.get<DestinationResponse[]>(`/v1/trips/${id}/destinations`);
  return data;
}

export async function addTripDestination(
  id: string,
  dto: CreateDestinationPayload,
): Promise<DestinationWriteResponse> {
  const { data } = await apiClient.post<DestinationWriteResponse>(
    `/v1/trips/${id}/destinations`,
    dto,
  );
  return data;
}

export async function reorderTripDestinations(
  id: string,
  dto: ReorderDestinationsPayload,
): Promise<DestinationResponse[]> {
  const { data } = await apiClient.patch<DestinationResponse[]>(
    `/v1/trips/${id}/destinations/reorder`,
    dto,
  );
  return data;
}

export async function updateTripDestination(
  id: string,
  destId: string,
  dto: UpdateDestinationPayload,
): Promise<DestinationWriteResponse> {
  const { data } = await apiClient.patch<DestinationWriteResponse>(
    `/v1/trips/${id}/destinations/${destId}`,
    dto,
  );
  return data;
}

export async function deleteTripDestination(id: string, destId: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}/destinations/${destId}`);
}

// ─── Participant methods ──────────────────────────────────────────────────────

export async function getTripParticipants(id: string): Promise<TripParticipantResponse[]> {
  const { data } = await apiClient.get<TripParticipantResponse[]>(`/v1/trips/${id}/participants`);
  return data;
}

export async function getPendingTripParticipants(
  id: string,
): Promise<PendingTripParticipantResponse[]> {
  const { data } = await apiClient.get<PendingTripParticipantResponse[]>(
    `/v1/trips/${id}/participants/pending`,
  );
  return data;
}

export async function updateTripParticipantRole(
  id: string,
  userId: string,
  payload: UpdateParticipantRolePayload,
): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/participants/${userId}/role`, payload);
}

export async function removeTripParticipant(id: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}/participants/${userId}`);
}

export async function exportTripParticipants(
  tripId: string,
  format: ExportFormat,
  fields: ExportField[],
): Promise<void> {
  const params = new URLSearchParams({ format });
  fields.forEach((f) => params.append('fields', f));

  const response = await apiClient.get(`/v1/trips/${tripId}/participants/export?${params}`, {
    responseType: 'blob',
  });

  const extensions: Record<string, string> = { csv: 'csv', xlsx: 'xlsx', ods: 'ods' };
  const ext = extensions[format] ?? format;
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `participants.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Global invitation methods ────────────────────────────────────────────────

export async function getMyTripInvitations(): Promise<MyTripInvitationResponse[]> {
  const { data } = await apiClient.get<MyTripInvitationResponse[]>('/v1/trips/invitations');
  return data;
}

// ─── Trip invitation methods ──────────────────────────────────────────────────

export async function inviteTripParticipants(
  id: string,
  payload: CreateTripInvitationPayload,
): Promise<BulkInvitationResponse> {
  const { data } = await apiClient.post<BulkInvitationResponse>(
    `/v1/trips/${id}/invitations`,
    payload,
  );
  return data;
}

export async function acceptTripInvitation(id: string): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/invitations/accept`);
}

export async function declineTripInvitation(id: string): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/invitations/decline`);
}

export async function revokeTripInvitation(id: string, userId: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}/invitations/${userId}`);
}

// ─── Trip join request methods ────────────────────────────────────────────────

export async function submitJoinRequest(id: string): Promise<void> {
  await apiClient.post(`/v1/trips/${id}/join-request`);
}

export async function withdrawJoinRequest(id: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}/join-request`);
}

export async function toggleTripParticipantConfirmation(id: string, userId: string): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/participants/${userId}/confirmation`);
}

export async function acceptJoinRequest(id: string, userId: string): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/join-requests/${userId}/accept`);
}

export async function rejectJoinRequest(id: string, userId: string): Promise<void> {
  await apiClient.patch(`/v1/trips/${id}/join-requests/${userId}/reject`);
}

// ─── Group methods ────────────────────────────────────────────────────────────

export async function getTripGroups(id: string): Promise<TripGroupResponse[]> {
  const { data } = await apiClient.get<TripGroupResponse[]>(`/v1/trips/${id}/groups`);
  return data;
}

export async function getTripLinkedGroups(id: string): Promise<TripLinkedGroup[]> {
  const { data } = await apiClient.get<TripLinkedGroup[]>(`/v1/trips/${id}/linked-groups`);
  return data;
}

export async function addTripGroup(
  id: string,
  dto: AddTripGroupPayload,
): Promise<TripGroupResponse> {
  const { data } = await apiClient.post<TripGroupResponse>(`/v1/trips/${id}/groups`, dto);
  return data;
}

export async function removeTripGroup(id: string, groupId: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${id}/groups/${groupId}`);
}

// ─── Announcement methods ─────────────────────────────────────────────────────

export async function getTripAnnouncements(
  tripId: string,
  limit: number,
  offset: number,
): Promise<TripAnnouncementsResponse> {
  const { data } = await apiClient.get<TripAnnouncementsResponse>(
    `/v1/trips/${tripId}/announcements`,
    { params: { limit, offset } },
  );
  return data;
}

export async function getTripAnnouncement(
  tripId: string,
  announcementId: string,
): Promise<TripAnnouncement> {
  const { data } = await apiClient.get<TripAnnouncement>(
    `/v1/trips/${tripId}/announcements/${announcementId}`,
  );
  return data;
}

export async function createTripAnnouncement(
  tripId: string,
  payload: TripAnnouncementPayload,
): Promise<TripAnnouncement> {
  const { data } = await apiClient.post<TripAnnouncement>(
    `/v1/trips/${tripId}/announcements`,
    payload,
  );
  return data;
}

export async function updateTripAnnouncement(
  tripId: string,
  announcementId: string,
  payload: TripAnnouncementPayload,
): Promise<TripAnnouncement> {
  const { data } = await apiClient.patch<TripAnnouncement>(
    `/v1/trips/${tripId}/announcements/${announcementId}`,
    payload,
  );
  return data;
}

export async function deleteTripAnnouncement(
  tripId: string,
  announcementId: string,
): Promise<void> {
  await apiClient.delete(`/v1/trips/${tripId}/announcements/${announcementId}`);
}

// ─── Task methods ───────────────────────────────────────────────────────────────

export async function getTripTasks(tripId: string): Promise<TripTask[]> {
  const { data } = await apiClient.get<TripTask[]>(`/v1/trips/${tripId}/tasks`);
  return data;
}

export async function createTripTask(
  tripId: string,
  payload: CreateTripTaskPayload,
): Promise<TripTask> {
  const { data } = await apiClient.post<TripTask>(`/v1/trips/${tripId}/tasks`, payload);
  return data;
}

export async function updateTripTaskTitle(
  tripId: string,
  taskId: string,
  payload: UpdateTripTaskPayload,
): Promise<TripTask> {
  const { data } = await apiClient.patch<TripTask>(`/v1/trips/${tripId}/tasks/${taskId}`, payload);
  return data;
}

export async function setTripTaskCompletion(
  tripId: string,
  taskId: string,
  payload: SetTripTaskCompletionPayload,
): Promise<TripTask> {
  const { data } = await apiClient.patch<TripTask>(
    `/v1/trips/${tripId}/tasks/${taskId}/completion`,
    payload,
  );
  return data;
}

export async function deleteTripTask(tripId: string, taskId: string): Promise<void> {
  await apiClient.delete(`/v1/trips/${tripId}/tasks/${taskId}`);
}
