import { Test, TestingModule } from '@nestjs/testing';
import { TripParticipantStatus, TripStatus, TripVisibility } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripDiscoveryService } from './trip-discovery.service';
import type { SearchTripsQueryDto } from './dto/search-trips-query.dto';

const mockTripRow = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: 'A beach trip.',
  cover: null,
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CDMX',
  landingCountry: 'MX',
  landingCity: 'Cancún',
  defaultTimezone: 'America/Cancun',
  defaultCurrency: 'MXN',
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'organizer-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  requiresConfirmation: false,
};

const mockDestinationRow = {
  tripId: 'trip-uuid',
  city: 'Cancún',
  countryCode: 'MX',
  position: 1,
};

describe('TripDiscoveryService', () => {
  let service: TripDiscoveryService;
  let mockTripsFindMany: jest.Mock;
  let mockTripParticipantsFindMany: jest.Mock;
  let mockTripDestinationsFindMany: jest.Mock;
  let mockSelectFrom: jest.Mock;

  beforeEach(async () => {
    mockTripsFindMany = jest.fn();
    mockTripParticipantsFindMany = jest.fn();
    mockTripDestinationsFindMany = jest.fn();
    mockSelectFrom = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripDiscoveryService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findMany: mockTripsFindMany },
              tripParticipants: { findMany: mockTripParticipantsFindMany },
              tripDestinations: { findMany: mockTripDestinationsFindMany },
            },
            select: () => ({ from: () => ({ where: mockSelectFrom }) }),
          },
        },
      ],
    }).compile();

    service = module.get<TripDiscoveryService>(TripDiscoveryService);
  });

  describe('searchTrips', () => {
    const query: SearchTripsQueryDto = { q: 'cancun', limit: 20, offset: 0 };

    it('returns empty result when count is zero', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 0 }]);
      const result = await service.searchTrips('user-uuid', query);
      expect(result).toEqual({ data: [], total: 0 });
      expect(mockTripsFindMany).not.toHaveBeenCalled();
    });

    it('returns empty result when no rows after pagination', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 5 }]);
      mockTripsFindMany.mockResolvedValue([]);
      const result = await service.searchTrips('user-uuid', query);
      expect(result).toEqual({ data: [], total: 5 });
    });

    it('returns trips with participationStatus none for non-participant', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany.mockResolvedValue([]);
      mockTripDestinationsFindMany.mockResolvedValue([mockDestinationRow]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.total).toBe(1);
      expect(result.data[0]).toMatchObject({
        id: 'trip-uuid',
        name: 'Cancún 2026',
        participationStatus: 'none',
        confirmedParticipantCount: 0,
        destinations: [{ city: 'Cancún', countryCode: 'MX' }],
      });
    });

    it('returns participationStatus pending for user with PENDING_REQUEST', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany
        .mockResolvedValueOnce([]) // confirmed count query
        .mockResolvedValueOnce([
          { tripId: 'trip-uuid', status: TripParticipantStatus.PENDING_REQUEST },
        ]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.participationStatus).toBe('pending');
    });

    it('returns participationStatus pending for user with INVITED status', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tripId: 'trip-uuid', status: TripParticipantStatus.INVITED }]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.participationStatus).toBe('pending');
    });

    it('returns participationStatus active for user with ACCEPTED status', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany
        .mockResolvedValueOnce([{ tripId: 'trip-uuid' }])
        .mockResolvedValueOnce([{ tripId: 'trip-uuid', status: TripParticipantStatus.ACCEPTED }]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.participationStatus).toBe('active');
    });

    it('returns participationStatus none for user with DECLINED status', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tripId: 'trip-uuid', status: TripParticipantStatus.DECLINED }]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.participationStatus).toBe('none');
    });

    it('counts ACCEPTED and CONFIRMED participants', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany
        .mockResolvedValueOnce([
          { tripId: 'trip-uuid' },
          { tripId: 'trip-uuid' },
          { tripId: 'trip-uuid' },
        ])
        .mockResolvedValueOnce([]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.confirmedParticipantCount).toBe(3);
    });

    it('returns destinations in position order', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany.mockResolvedValue([]);
      mockTripDestinationsFindMany.mockResolvedValue([
        { tripId: 'trip-uuid', city: 'Cancún', countryCode: 'MX', position: 1 },
        { tripId: 'trip-uuid', city: 'Playa del Carmen', countryCode: 'MX', position: 2 },
      ]);

      const result = await service.searchTrips('user-uuid', query);

      expect(result.data[0]?.destinations).toEqual([
        { city: 'Cancún', countryCode: 'MX' },
        { city: 'Playa del Carmen', countryCode: 'MX' },
      ]);
    });

    it('works with empty query (no name filter)', async () => {
      mockSelectFrom.mockResolvedValue([{ total: 1 }]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);
      mockTripParticipantsFindMany.mockResolvedValue([]);
      mockTripDestinationsFindMany.mockResolvedValue([]);

      const result = await service.searchTrips('user-uuid', { limit: 20, offset: 0 });

      expect(result.total).toBe(1);
    });
  });
});
