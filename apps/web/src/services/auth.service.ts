import { apiClient } from '@/services/api-client';
import type { RegisterPayload } from '@/services/auth.types';

// ─── Auth methods ─────────────────────────────────────────────────────────────

export async function register(dto: RegisterPayload): Promise<void> {
  await apiClient.post('/v1/auth/register', dto);
}

export async function logout(): Promise<void> {
  await apiClient.post('/v1/auth/logout');
}

export async function checkMe(): Promise<void> {
  const { data } = await apiClient.get<void>('/v1/users/me');
  return data;
}
