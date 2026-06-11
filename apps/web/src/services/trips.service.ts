import { apiClient } from '@/services/api-client';

import type {
  AddTripGroupPayload,
  CreateDestinationPayload,
  CreateTripPayload,
  DestinationResponse,
  DestinationWriteResponse,
  ReorderDestinationsPayload,
  TransitionTripStatusPayload,
  TripGroupResponse,
  TripResponse,
  UpdateDestinationPayload,
  UpdateTripPayload,
} from '@/services/trips.types';

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

// ─── Group methods ────────────────────────────────────────────────────────────

export async function getTripGroups(id: string): Promise<TripGroupResponse[]> {
  const { data } = await apiClient.get<TripGroupResponse[]>(`/v1/trips/${id}/groups`);
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
