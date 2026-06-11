import { checkMe, logout, register } from './auth.service';
import type { RegisterPayload } from '@/services/auth.types';

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

const registerPayload: RegisterPayload = {
  username: 'johndoe',
  displayName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: { day: 15, month: 6, year: 1990, yearVisible: true },
  homeCountry: 'MX',
  phoneCountryCode: '+52',
  phoneLocalNumber: '5551234567',
  email: 'john@example.com',
  timezone: 'America/Mexico_City',
};

// ─── Auth methods ─────────────────────────────────────────────────────────────

describe('register', () => {
  it('posts to /v1/auth/register', async () => {
    mockPost.mockResolvedValueOnce({});
    await register(registerPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/auth/register', registerPayload);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(register(registerPayload)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(register(registerPayload)).rejects.toEqual({ response: { status: 422 } });
  });
});

describe('logout', () => {
  it('posts to /v1/auth/logout', async () => {
    mockPost.mockResolvedValueOnce({});
    await logout();
    expect(mockPost).toHaveBeenCalledWith('/v1/auth/logout');
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(logout()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 500 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(logout()).rejects.toEqual({ response: { status: 500 } });
  });
});

describe('checkMe', () => {
  it('gets /v1/users/me and returns the record', async () => {
    const record = { id: 'user-uuid-1', username: 'johndoe' };
    mockGet.mockResolvedValueOnce({ data: record });
    const result = await checkMe();
    expect(mockGet).toHaveBeenCalledWith('/v1/users/me');
    expect(result).toEqual(record);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(checkMe()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(checkMe()).rejects.toEqual({ response: { status: 404 } });
  });
});
