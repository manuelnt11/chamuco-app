import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

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
} from './trips.types';

type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(fn: TokenProvider): void {
  tokenProvider = fn;
}

// Extend InternalAxiosRequestConfig to track retry state
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token when available
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

// Response interceptor — on 401, force-refresh the token and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { config?: RetryableRequestConfig; response?: { status: number } };
    const originalRequest = axiosError.config;

    if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (tokenProvider) {
        const freshToken = await tokenProvider(true);
        if (freshToken) {
          originalRequest.headers.set('Authorization', `Bearer ${freshToken}`);
        }
      }

      return apiClient(originalRequest as AxiosRequestConfig);
    }

    return Promise.reject(error);
  },
);

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
