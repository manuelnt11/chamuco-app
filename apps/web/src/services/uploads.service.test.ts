import { getSignedUrl } from './uploads.service';
import type { GetSignedUrlPayload, SignedUrlResponse } from '@/services/uploads.types';
import { UploadType } from '@chamuco/shared-types';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch, mockDelete: del };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const signedUrlPayload: GetSignedUrlPayload = {
  uploadType: UploadType.USER_AVATAR,
  contextId: 'user-uuid-1',
  contentType: 'image/jpeg',
  fileSize: 204800,
};

const signedUrlResponseFixture: SignedUrlResponse = {
  uploadUrl: 'https://storage.googleapis.com/bucket/avatars/user-uuid-1.jpg?signed=abc',
  objectKey: 'avatars/user-uuid-1.jpg',
  expiresAt: '2026-01-01T01:00:00.000Z',
};

// ─── Upload methods ───────────────────────────────────────────────────────────

describe('getSignedUrl', () => {
  it('posts to /v1/uploads/signed-url and returns the response', async () => {
    mockPost.mockResolvedValueOnce({ data: signedUrlResponseFixture });
    const result = await getSignedUrl(signedUrlPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/uploads/signed-url', signedUrlPayload);
    expect(result).toEqual(signedUrlResponseFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getSignedUrl(signedUrlPayload)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(getSignedUrl(signedUrlPayload)).rejects.toEqual({ response: { status: 422 } });
  });
});
