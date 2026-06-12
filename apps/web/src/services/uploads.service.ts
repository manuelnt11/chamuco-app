import { apiClient } from '@/services/api-client';
import type { SignedUrlResponse } from '@chamuco/shared-types';
import type { GetSignedUrlPayload } from '@/services/uploads.types';

// ─── Upload methods ───────────────────────────────────────────────────────────

export async function getSignedUrl(payload: GetSignedUrlPayload): Promise<SignedUrlResponse> {
  const { data } = await apiClient.post<SignedUrlResponse>('/v1/uploads/signed-url', payload);
  return data;
}
