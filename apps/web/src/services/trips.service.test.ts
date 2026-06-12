import {
  addTripDestination,
  addTripGroup,
  createTrip,
  deleteTrip,
  deleteTripDestination,
  getMyTrips,
  getTrip,
  getTripDestinations,
  getTripGroups,
  removeTripGroup,
  reorderTripDestinations,
  transitionTripStatus,
  updateTrip,
  updateTripDestination,
} from './trips.service';
import type {
  DestinationResponse,
  DestinationWriteResponse,
  MyTripListItemResponse,
  TripGroupResponse,
  TripResponse,
} from '@/services/trips.types';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';

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

// ─── List methods ────────────────────────────────────────────────────────────

const myTripFixture: MyTripListItemResponse = {
  ...tripFixture,
  coverUrl: 'https://storage.googleapis.com/bucket/trip-covers/trip-uuid-1/cover.jpg',
  confirmedParticipantCount: 4,
  userRole: TripRole.ORGANIZER,
};

describe('getMyTrips', () => {
  it('gets /v1/trips and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [myTripFixture] });
    const result = await getMyTrips();
    expect(mockGet).toHaveBeenCalledWith('/v1/trips');
    expect(result).toEqual([myTripFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getMyTrips()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getMyTrips()).rejects.toEqual({ response: { status: 404 } });
  });
});

// ─── Trip methods ─────────────────────────────────────────────────────────────

const minCreateTripPayload = {
  name: 'Trip',
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 1,
  departureCountry: 'MX',
  departureCity: 'CDMX',
  landingCountry: 'MX',
  landingCity: 'Cancun',
  isTravelingParticipant: true,
};

describe('createTrip', () => {
  it('posts to /v1/trips and returns the trip', async () => {
    mockPost.mockResolvedValueOnce({ data: tripFixture });
    const result = await createTrip(minCreateTripPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips', minCreateTripPayload);
    expect(result).toEqual(tripFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createTrip(minCreateTripPayload)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(createTrip(minCreateTripPayload)).rejects.toEqual({ response: { status: 404 } });
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
    await expect(
      reorderTripDestinations('trip-uuid-1', { destinationIds: ['dest-uuid-1'] }),
    ).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      reorderTripDestinations('trip-uuid-1', { destinationIds: ['dest-uuid-1'] }),
    ).rejects.toEqual({
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
