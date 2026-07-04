import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInvitationToken,
  getOpenInvitationToken,
  resolveInvitationToken,
  redeemInvitationToken,
  toggleInvitationToken,
} from './invitation-tokens.service';
import type {
  InvitationTokenCreateResponse,
  InvitationTokenResolveResponse,
} from '@chamuco/shared-types';
import { InvitationTokenContext } from '@chamuco/shared-types';

const { mockGet, mockPost, mockPatch } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch };
});

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mockGet, post: mockPost, patch: mockPatch },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
});

const TOKEN = 'abc123token';

const createResponse: InvitationTokenCreateResponse = {
  token: TOKEN,
  url: `http://localhost:3000/join?token=${TOKEN}`,
  isActive: true,
};

const resolveResponse: InvitationTokenResolveResponse = {
  token: TOKEN,
  contextType: InvitationTokenContext.REFERRAL,
  contextId: null,
  contextName: null,
  createdByDisplayName: 'Manuel',
  createdByUsername: 'manuel',
  note: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('createInvitationToken', () => {
  it('posts to /v1/invitation-tokens and returns response', async () => {
    mockPost.mockResolvedValueOnce({ data: createResponse });
    const payload = { contextType: InvitationTokenContext.REFERRAL };
    const result = await createInvitationToken(payload);
    expect(mockPost).toHaveBeenCalledWith('/v1/invitation-tokens', payload);
    expect(result).toEqual(createResponse);
  });

  it('propagates errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(
      createInvitationToken({ contextType: InvitationTokenContext.REFERRAL }),
    ).rejects.toEqual({ response: { status: 403 } });
  });
});

describe('resolveInvitationToken', () => {
  it('gets /v1/invitation-tokens/:token and returns response', async () => {
    mockGet.mockResolvedValueOnce({ data: resolveResponse });
    const result = await resolveInvitationToken(TOKEN);
    expect(mockGet).toHaveBeenCalledWith(`/v1/invitation-tokens/${TOKEN}`);
    expect(result).toEqual(resolveResponse);
  });

  it('propagates 404', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(resolveInvitationToken(TOKEN)).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('redeemInvitationToken', () => {
  it('posts to /v1/invitation-tokens/:token/redeem', async () => {
    const redeemResponse = {
      outcome: 'INVITED',
      contextType: InvitationTokenContext.REFERRAL,
      contextId: null,
    };
    mockPost.mockResolvedValueOnce({ data: redeemResponse });
    const result = await redeemInvitationToken(TOKEN);
    expect(mockPost).toHaveBeenCalledWith(`/v1/invitation-tokens/${TOKEN}/redeem`);
    expect(result).toEqual(redeemResponse);
  });
});

describe('toggleInvitationToken', () => {
  it('patches /v1/invitation-tokens/:token/toggle', async () => {
    mockPatch.mockResolvedValueOnce({});
    await toggleInvitationToken(TOKEN);
    expect(mockPatch).toHaveBeenCalledWith(`/v1/invitation-tokens/${TOKEN}/toggle`);
  });
});

describe('getOpenInvitationToken', () => {
  it('gets /v1/invitation-tokens/open with params and returns response', async () => {
    const response = { token: TOKEN, url: `http://localhost:3000/join?token=${TOKEN}` };
    mockGet.mockResolvedValueOnce({ data: response });
    const result = await getOpenInvitationToken({
      contextType: InvitationTokenContext.TRIP,
      contextId: 'trip-uuid',
    });
    expect(mockGet).toHaveBeenCalledWith('/v1/invitation-tokens/open', {
      params: { contextType: InvitationTokenContext.TRIP, contextId: 'trip-uuid' },
    });
    expect(result).toEqual(response);
  });

  it('returns null on 404', async () => {
    mockGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    const result = await getOpenInvitationToken({ contextType: InvitationTokenContext.REFERRAL });
    expect(result).toBeNull();
  });

  it('propagates non-404 errors', async () => {
    mockGet.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } });
    await expect(
      getOpenInvitationToken({ contextType: InvitationTokenContext.REFERRAL }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });
});
