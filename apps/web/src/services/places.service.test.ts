import { searchCities } from './places.service';
import type { CityResult } from '@/services/places.types';

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

const cityFixture: CityResult = {
  name: 'Cancun',
  region: 'Quintana Roo',
};

// ─── Places methods ───────────────────────────────────────────────────────────

describe('searchCities', () => {
  it('gets /v1/locations/cities with params and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [cityFixture] });
    const result = await searchCities('MX', 'Can');
    expect(mockGet).toHaveBeenCalledWith('/v1/locations/cities', {
      params: { namePrefix: 'Can', country: 'MX' },
      signal: undefined,
    });
    expect(result).toEqual([cityFixture]);
  });

  it('passes AbortSignal when provided', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: [] });
    await searchCities('MX', 'Can', controller.signal);
    expect(mockGet).toHaveBeenCalledWith('/v1/locations/cities', {
      params: { namePrefix: 'Can', country: 'MX' },
      signal: controller.signal,
    });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(searchCities('MX', 'Can')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(searchCities('MX', 'Can')).rejects.toEqual({ response: { status: 404 } });
  });
});
