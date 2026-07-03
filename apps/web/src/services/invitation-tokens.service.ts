import { isAxiosError } from 'axios';
import { apiClient } from '@/services/api-client';
import type {
  InvitationTokenCreateResponse,
  InvitationTokenRedeemResponse,
  InvitationTokenResolveResponse,
} from '@chamuco/shared-types';
import type { InvitationTokenContext } from '@chamuco/shared-types';
import type { CreateInvitationTokenPayload } from '@/services/invitation-tokens.types';

export async function createInvitationToken(
  payload: CreateInvitationTokenPayload,
): Promise<InvitationTokenCreateResponse> {
  const { data } = await apiClient.post<InvitationTokenCreateResponse>(
    '/v1/invitation-tokens',
    payload,
  );
  return data;
}

export async function resolveInvitationToken(
  token: string,
): Promise<InvitationTokenResolveResponse> {
  const { data } = await apiClient.get<InvitationTokenResolveResponse>(
    `/v1/invitation-tokens/${token}`,
  );
  return data;
}

export async function redeemInvitationToken(token: string): Promise<InvitationTokenRedeemResponse> {
  const { data } = await apiClient.post<InvitationTokenRedeemResponse>(
    `/v1/invitation-tokens/${token}/redeem`,
  );
  return data;
}

export async function toggleInvitationToken(token: string): Promise<void> {
  await apiClient.patch(`/v1/invitation-tokens/${token}/toggle`);
}

export async function getOpenInvitationToken(params: {
  contextType: InvitationTokenContext;
  contextId?: string;
}): Promise<InvitationTokenCreateResponse | null> {
  try {
    const { data } = await apiClient.get<InvitationTokenCreateResponse>(
      '/v1/invitation-tokens/open',
      { params },
    );
    return data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}
