import {
  addTripDestination,
  addTripGroup,
  apiClient,
  createTrip,
  deleteTrip,
  deleteTripDestination,
  getTrip,
  getTripDestinations,
  getTripGroups,
  removeTripGroup,
  reorderTripDestinations,
  setTokenProvider,
  transitionTripStatus,
  updateTrip,
  updateTripDestination,
} from './api-client';
import type {
  DestinationResponse,
  DestinationWriteResponse,
  TripGroupResponse,
  TripResponse,
} from './trips.types';
import { TripStatus, TripVisibility } from '@chamuco/shared-types';

// vi.hoisted ensures these exist before the vi.mock factory runs
const {
  mockAxiosInstance,
  mockRequestUse,
  mockResponseUse,
  mockGet,
  mockPost,
  mockPatch,
  mockDelete,
} = vi.hoisted(() => {
  const reqUse = vi.fn();
  const resUse = vi.fn();
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  // The instance is also called by the response interceptor during retry
  const instance = Object.assign(vi.fn().mockResolvedValue({ status: 200 }), {
    interceptors: {
      request: { use: reqUse },
      response: { use: resUse },
    },
    get,
    post,
    patch,
    delete: del,
  });
  return {
    mockAxiosInstance: instance,
    mockRequestUse: reqUse,
    mockResponseUse: resUse,
    mockGet: get,
    mockPost: post,
    mockPatch: patch,
    mockDelete: del,
  };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

// Interceptor handlers registered at module load time — extract once
let requestFulfilled: (config: Record<string, unknown>) => Promise<Record<string, unknown>>;
let responseFulfilled: (res: unknown) => unknown;
let responseRejected: (err: unknown) => Promise<unknown>;

beforeAll(() => {
  requestFulfilled = mockRequestUse.mock.calls[0]![0] as typeof requestFulfilled;
  [responseFulfilled, responseRejected] = mockResponseUse.mock.calls[0]! as [
    typeof responseFulfilled,
    typeof responseRejected,
  ];
});

beforeEach(() => {
  // Reset tokenProvider to null between tests
  setTokenProvider(null as unknown as Parameters<typeof setTokenProvider>[0]);
  mockAxiosInstance.mockClear();
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

describe('setTokenProvider', () => {
  it('registers the token function so the request interceptor can call it', async () => {
    const mockProvider = vi.fn().mockResolvedValue('abc');
    setTokenProvider(mockProvider);

    const config = { headers: { set: vi.fn() } };
    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockProvider).toHaveBeenCalled();
  });
});

describe('request interceptor', () => {
  it('attaches Authorization header when the token provider returns a token', async () => {
    setTokenProvider(vi.fn().mockResolvedValue('token-abc'));
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    const result = await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).toHaveBeenCalledWith('Authorization', 'Bearer token-abc');
    expect(result).toBe(config);
  });

  it('does not attach Authorization header when the token is null', async () => {
    setTokenProvider(vi.fn().mockResolvedValue(null));
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('does not attach Authorization header when no provider is registered', async () => {
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('returns the config object unchanged', async () => {
    const config = { headers: { set: vi.fn() } };

    const result = await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(result).toBe(config);
  });
});

describe('response interceptor', () => {
  it('passes through successful responses unchanged', () => {
    const response = { status: 200, data: {} };

    expect(responseFulfilled(response)).toBe(response);
  });

  it('retries once with a force-refreshed token on 401', async () => {
    const freshToken = 'fresh-999';
    setTokenProvider(vi.fn().mockResolvedValue(freshToken));

    const mockSet = vi.fn();
    const originalRequest = { headers: { set: mockSet }, _retry: undefined };
    const error = { response: { status: 401 }, config: originalRequest };

    await responseRejected(error);

    expect(originalRequest._retry).toBe(true);
    expect(mockSet).toHaveBeenCalledWith('Authorization', `Bearer ${freshToken}`);
    expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
  });

  it('skips the Authorization update when force-refresh returns null', async () => {
    setTokenProvider(vi.fn().mockResolvedValue(null));

    const mockSet = vi.fn();
    const originalRequest = { headers: { set: mockSet }, _retry: undefined };
    const error = { response: { status: 401 }, config: originalRequest };

    await responseRejected(error);

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
  });

  it('does not retry a second time when _retry is already true', async () => {
    setTokenProvider(vi.fn().mockResolvedValue('some-token'));
    const error = {
      response: { status: 401 },
      config: { headers: { set: vi.fn() }, _retry: true },
    };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });

  it('rejects non-401 errors without retrying', async () => {
    const error = { response: { status: 500 }, config: { headers: { set: vi.fn() } } };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });

  it('rejects errors with no config without retrying', async () => {
    const error = { response: { status: 401 }, config: undefined };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });
});

describe('apiClient export', () => {
  it('is the axios instance created by axios.create', () => {
    expect(apiClient).toBe(mockAxiosInstance);
  });
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tripFixture: TripResponse = {
  id: 'trip-uuid-1',
  name: 'Cancún 2026',
  description: null,
  status: TripStatus.DRAFT,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'Ciudad de Mexico',
  landingCountry: 'MX',
  landingCity: 'Cancun',
  defaultTimezone: 'America/Cancun',
  defaultCurrency: 'MXN',
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-uuid-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
};

const destFixture: DestinationResponse = {
  id: 'dest-uuid-1',
  tripId: 'trip-uuid-1',
  position: 1,
  countryCode: 'MX',
  city: 'Cancun',
  label: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const destWriteFixture: DestinationWriteResponse = { ...destFixture, requiresConfirmation: false };

const groupLinkFixture: TripGroupResponse = {
  tripId: 'trip-uuid-1',
  groupId: 'group-uuid-1',
  addedAt: '2026-01-01T00:00:00.000Z',
};

// ─── Trip methods ─────────────────────────────────────────────────────────────

describe('createTrip', () => {
  it('posts to /v1/trips and returns the trip', async () => {
    mockPost.mockResolvedValueOnce({ data: tripFixture });
    const payload = {
      name: 'Cancún 2026',
      visibility: TripVisibility.PUBLIC,
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      participantCapacity: 10,
      departureCountry: 'MX',
      departureCity: 'CDMX',
      landingCountry: 'MX',
      landingCity: 'Cancun',
      isTravelingParticipant: true,
    };
    const result = await createTrip(payload);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips', payload);
    expect(result).toEqual(tripFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      createTrip({
        name: 'x',
        visibility: TripVisibility.PUBLIC,
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        participantCapacity: 1,
        departureCountry: 'MX',
        departureCity: 'CDMX',
        landingCountry: 'MX',
        landingCity: 'Cancun',
        isTravelingParticipant: true,
      }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      createTrip({
        name: 'x',
        visibility: TripVisibility.PUBLIC,
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        participantCapacity: 1,
        departureCountry: 'MX',
        departureCity: 'CDMX',
        landingCountry: 'MX',
        landingCity: 'Cancun',
        isTravelingParticipant: true,
      }),
    ).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('getTrip', () => {
  it('gets /v1/trips/:id and returns the trip', async () => {
    mockGet.mockResolvedValueOnce({ data: tripFixture });
    const result = await getTrip('trip-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1');
    expect(result).toEqual(tripFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTrip('trip-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getTrip('trip-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('updateTrip', () => {
  it('patches /v1/trips/:id and returns the trip', async () => {
    mockPatch.mockResolvedValueOnce({ data: tripFixture });
    const result = await updateTrip('trip-uuid-1', { name: 'Updated' });
    expect(mockPatch).toHaveBeenCalledWith('/v1/trips/trip-uuid-1', { name: 'Updated' });
    expect(result).toEqual(tripFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateTrip('trip-uuid-1', {})).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateTrip('trip-uuid-1', {})).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('deleteTrip', () => {
  it('deletes /v1/trips/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteTrip('trip-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/trips/trip-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteTrip('trip-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteTrip('trip-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('transitionTripStatus', () => {
  it('patches /v1/trips/:id/status and returns the trip', async () => {
    mockPatch.mockResolvedValueOnce({ data: tripFixture });
    const dto = { status: TripStatus.OPEN };
    const result = await transitionTripStatus('trip-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/status', dto);
    expect(result).toEqual(tripFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(transitionTripStatus('trip-uuid-1', { status: TripStatus.OPEN })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(transitionTripStatus('trip-uuid-1', { status: TripStatus.OPEN })).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Destination methods ──────────────────────────────────────────────────────

describe('getTripDestinations', () => {
  it('gets /v1/trips/:id/destinations and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [destFixture] });
    const result = await getTripDestinations('trip-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/destinations');
    expect(result).toEqual([destFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTripDestinations('trip-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getTripDestinations('trip-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('addTripDestination', () => {
  it('posts to /v1/trips/:id/destinations and returns the destination', async () => {
    mockPost.mockResolvedValueOnce({ data: destWriteFixture });
    const dto = { countryCode: 'MX', city: 'Cancun' };
    const result = await addTripDestination('trip-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/destinations', dto);
    expect(result).toEqual(destWriteFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      addTripDestination('trip-uuid-1', { countryCode: 'MX', city: 'Cancun' }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      addTripDestination('trip-uuid-1', { countryCode: 'MX', city: 'Cancun' }),
    ).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('reorderTripDestinations', () => {
  it('patches /v1/trips/:id/destinations/reorder and returns the list', async () => {
    mockPatch.mockResolvedValueOnce({ data: [destFixture] });
    const dto = { destinationIds: ['dest-uuid-1'] };
    const result = await reorderTripDestinations('trip-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/destinations/reorder', dto);
    expect(result).toEqual([destFixture]);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(reorderTripDestinations('trip-uuid-1', { destinationIds: [] })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(reorderTripDestinations('trip-uuid-1', { destinationIds: [] })).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('updateTripDestination', () => {
  it('patches /v1/trips/:id/destinations/:destId and returns the destination', async () => {
    mockPatch.mockResolvedValueOnce({ data: destWriteFixture });
    const dto = { city: 'Tulum' };
    const result = await updateTripDestination('trip-uuid-1', 'dest-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/destinations/dest-uuid-1', dto);
    expect(result).toEqual(destWriteFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(updateTripDestination('trip-uuid-1', 'dest-uuid-1', {})).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(updateTripDestination('trip-uuid-1', 'dest-uuid-1', {})).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('deleteTripDestination', () => {
  it('deletes /v1/trips/:id/destinations/:destId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteTripDestination('trip-uuid-1', 'dest-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/destinations/dest-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteTripDestination('trip-uuid-1', 'dest-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteTripDestination('trip-uuid-1', 'dest-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Group methods ────────────────────────────────────────────────────────────

describe('getTripGroups', () => {
  it('gets /v1/trips/:id/groups and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [groupLinkFixture] });
    const result = await getTripGroups('trip-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/groups');
    expect(result).toEqual([groupLinkFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTripGroups('trip-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getTripGroups('trip-uuid-1')).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('addTripGroup', () => {
  it('posts to /v1/trips/:id/groups and returns the link', async () => {
    mockPost.mockResolvedValueOnce({ data: groupLinkFixture });
    const dto = { groupId: 'group-uuid-1' };
    const result = await addTripGroup('trip-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/groups', dto);
    expect(result).toEqual(groupLinkFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(addTripGroup('trip-uuid-1', { groupId: 'group-uuid-1' })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(addTripGroup('trip-uuid-1', { groupId: 'group-uuid-1' })).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('removeTripGroup', () => {
  it('deletes /v1/trips/:id/groups/:groupId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await removeTripGroup('trip-uuid-1', 'group-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/groups/group-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(removeTripGroup('trip-uuid-1', 'group-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(removeTripGroup('trip-uuid-1', 'group-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});
