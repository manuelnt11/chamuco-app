import type { BulkInvitationResponse } from '@chamuco/shared-types';

import { apiClient } from '@/services/api-client';

import type {
  AddTripGroupPayload,
  CreateDestinationPayload,
  CreateTripInvitationPayload,
  CreateTripPayload,
  DestinationResponse,
  DestinationWriteResponse,
  MyTripInvitationResponse,
  MyTripListItemResponse,
  MyTripParticipationResponse,
  PendingTripParticipantResponse,
  ReorderDestinationsPayload,
  TransitionTripStatusPayload,
  TripGroupResponse,
  TripLinkedGroup,
  TripParticipantResponse,
  TripResponse,
  UpdateDestinationPayload,
  UpdateParticipantRolePayload,
  UpdateTripPayload,
} from '@/services/trips.types';

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
