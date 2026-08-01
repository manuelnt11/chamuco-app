import {
  addTripDestination,
  addTripGroup,
  createTrip,
  createTripAnnouncement,
  createTripTask,
  deleteTrip,
  deleteTripAnnouncement,
  deleteTripDestination,
  deleteTripTask,
  getMyTrips,
  getTrip,
  getTripAnnouncement,
  getTripAnnouncements,
  getTripDestinations,
  getTripGroups,
  getTripTasks,
  removeTripGroup,
  reorderTripDestinations,
  searchTrips,
  setTripTaskCompletion,
  transitionTripStatus,
  updateTrip,
  updateTripAnnouncement,
  updateTripDestination,
} from './trips.service';
import type {
  DestinationResponse,
  DestinationWriteResponse,
  MyTripListItemResponse,
  TripAnnouncement,
  TripAnnouncementsResponse,
  TripGroupResponse,
  TripResponse,
  TripSearchResponse,
  TripTask,
} from '@/services/trips.types';
import { TripRole, TripStatus, TripTaskScope, TripVisibility } from '@chamuco/shared-types';

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
  coverUrl: null,
};

const destFixture: DestinationResponse = {
  id: 'dest-uuid-1',
  tripId: 'trip-uuid-1',
  position: 1,
  countryCode: 'MX',
  city: 'Cancun',
  label: null,
  itinerary: null,
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
  cover: { source: 'emoji' as const, target: '🏖️' },
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

// ─── Discovery methods ────────────────────────────────────────────────────────

const tripSearchFixture: TripSearchResponse = {
  data: [
    {
      id: 'trip-uuid-1',
      name: 'Cancún 2026',
      description: null,
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      participantCapacity: 10,
      confirmedParticipantCount: 3,
      destinations: [{ city: 'Cancún', countryCode: 'MX' }],
      participationStatus: 'none',
    },
  ],
  total: 1,
};

describe('searchTrips', () => {
  it('gets /v1/trips/search with params and returns the response', async () => {
    mockGet.mockResolvedValueOnce({ data: tripSearchFixture });
    const result = await searchTrips({ q: 'cancun', limit: 20, offset: 0 });
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/search', {
      params: { q: 'cancun', limit: 20, offset: 0 },
      signal: undefined,
    });
    expect(result).toEqual(tripSearchFixture);
  });

  it('passes AbortSignal to the request', async () => {
    mockGet.mockResolvedValueOnce({ data: tripSearchFixture });
    const controller = new AbortController();
    await searchTrips({ q: 'test' }, controller.signal);
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/search', {
      params: { q: 'test' },
      signal: controller.signal,
    });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(searchTrips({ q: 'cancun' })).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 400 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 400 } });
    await expect(searchTrips({})).rejects.toEqual({ response: { status: 400 } });
  });
});

// ─── Announcement methods ─────────────────────────────────────────────────────

const announcementFixture: TripAnnouncement = {
  id: 'announcement-uuid-1',
  tripId: 'trip-uuid-1',
  createdByUsername: 'orguser',
  content: 'Departs Friday at 6am sharp.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const announcementsPageFixture: TripAnnouncementsResponse = {
  items: [announcementFixture],
  total: 1,
};

describe('getTripAnnouncements', () => {
  it('gets /v1/trips/:tripId/announcements with pagination and returns the response', async () => {
    mockGet.mockResolvedValueOnce({ data: announcementsPageFixture });
    const result = await getTripAnnouncements('trip-uuid-1', 10, 0);
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/announcements', {
      params: { limit: 10, offset: 0 },
    });
    expect(result).toEqual(announcementsPageFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTripAnnouncements('trip-uuid-1', 10, 0)).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getTripAnnouncements('trip-uuid-1', 10, 0)).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('getTripAnnouncement', () => {
  it('gets /v1/trips/:tripId/announcements/:announcementId and returns the announcement', async () => {
    mockGet.mockResolvedValueOnce({ data: announcementFixture });
    const result = await getTripAnnouncement('trip-uuid-1', 'announcement-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/announcements/announcement-uuid-1');
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTripAnnouncement('trip-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getTripAnnouncement('trip-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('createTripAnnouncement', () => {
  it('posts to /v1/trips/:tripId/announcements and returns the announcement', async () => {
    mockPost.mockResolvedValueOnce({ data: announcementFixture });
    const dto = { content: 'Departs Friday at 6am sharp.' };
    const result = await createTripAnnouncement('trip-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/announcements', dto);
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(createTripAnnouncement('trip-uuid-1', { content: 'Hello' })).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 403 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(createTripAnnouncement('trip-uuid-1', { content: 'Hello' })).rejects.toEqual({
      response: { status: 403 },
    });
  });
});

describe('updateTripAnnouncement', () => {
  it('patches /v1/trips/:tripId/announcements/:announcementId and returns the announcement', async () => {
    mockPatch.mockResolvedValueOnce({ data: announcementFixture });
    const dto = { content: 'Updated content' };
    const result = await updateTripAnnouncement('trip-uuid-1', 'announcement-uuid-1', dto);
    expect(mockPatch).toHaveBeenCalledWith(
      '/v1/trips/trip-uuid-1/announcements/announcement-uuid-1',
      dto,
    );
    expect(result).toEqual(announcementFixture);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      updateTripAnnouncement('trip-uuid-1', 'announcement-uuid-1', { content: 'x' }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      updateTripAnnouncement('trip-uuid-1', 'announcement-uuid-1', { content: 'x' }),
    ).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('deleteTripAnnouncement', () => {
  it('deletes /v1/trips/:tripId/announcements/:announcementId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteTripAnnouncement('trip-uuid-1', 'announcement-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith(
      '/v1/trips/trip-uuid-1/announcements/announcement-uuid-1',
    );
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteTripAnnouncement('trip-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteTripAnnouncement('trip-uuid-1', 'announcement-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

// ─── Task methods ─────────────────────────────────────────────────────────────

const taskFixture: TripTask = {
  id: 'task-uuid-1',
  tripId: 'trip-uuid-1',
  scope: TripTaskScope.PERSONAL,
  title: 'Pack sunscreen',
  completed: false,
  ownerId: 'user-uuid-1',
  createdBy: 'user-uuid-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('getTripTasks', () => {
  it('gets /v1/trips/:tripId/tasks and returns the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [taskFixture] });
    const result = await getTripTasks('trip-uuid-1');
    expect(mockGet).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/tasks');
    expect(result).toEqual([taskFixture]);
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getTripTasks('trip-uuid-1')).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 403 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(getTripTasks('trip-uuid-1')).rejects.toEqual({ response: { status: 403 } });
  });
});

describe('createTripTask', () => {
  it('posts to /v1/trips/:tripId/tasks and returns the task', async () => {
    mockPost.mockResolvedValueOnce({ data: taskFixture });
    const dto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };
    const result = await createTripTask('trip-uuid-1', dto);
    expect(mockPost).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/tasks', dto);
    expect(result).toEqual(taskFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      createTripTask('trip-uuid-1', { scope: TripTaskScope.PERSONAL, title: 'x' }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 403 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(
      createTripTask('trip-uuid-1', { scope: TripTaskScope.SHARED, title: 'x' }),
    ).rejects.toEqual({ response: { status: 403 } });
  });
});

describe('setTripTaskCompletion', () => {
  it('patches /v1/trips/:tripId/tasks/:taskId/completion and returns the task', async () => {
    const completedTask = { ...taskFixture, completed: true };
    mockPatch.mockResolvedValueOnce({ data: completedTask });
    const result = await setTripTaskCompletion('trip-uuid-1', 'task-uuid-1', { completed: true });
    expect(mockPatch).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/tasks/task-uuid-1/completion', {
      completed: true,
    });
    expect(result).toEqual(completedTask);
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(
      setTripTaskCompletion('trip-uuid-1', 'task-uuid-1', { completed: true }),
    ).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(
      setTripTaskCompletion('trip-uuid-1', 'task-uuid-1', { completed: true }),
    ).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('deleteTripTask', () => {
  it('deletes /v1/trips/:tripId/tasks/:taskId', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteTripTask('trip-uuid-1', 'task-uuid-1');
    expect(mockDelete).toHaveBeenCalledWith('/v1/trips/trip-uuid-1/tasks/task-uuid-1');
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(deleteTripTask('trip-uuid-1', 'task-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(deleteTripTask('trip-uuid-1', 'task-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});
