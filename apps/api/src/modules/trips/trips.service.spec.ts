import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  PlatformRole,
  ProfileVisibility,
  TripParticipantStatus,
  TripRole,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripsService } from './trips.service';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type { AuthenticatedUser } from '@/types/express';

const mockUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockTripRow = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: null,
  cover: null,
  status: TripStatus.DRAFT,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockDestRow = {
  id: 'dest-uuid',
  tripId: 'trip-uuid',
  position: 1,
  countryCode: 'MX',
  city: 'CANCUN',
  label: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockOrganizerParticipant = {
  tripId: 'trip-uuid',
  userId: 'user-uuid',
  role: TripRole.ORGANIZER,
  status: TripParticipantStatus.CONFIRMED,
  isTraveler: true,
  didTravel: null,
  initiatedAt: new Date('2026-01-01T00:00:00.000Z'),
  confirmedAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  initiatedBy: 'user-uuid',
  decidedBy: 'user-uuid',
};

const createDto: CreateTripDto = {
  name: 'Cancún 2026',
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
  isTravelingParticipant: true,
};

const mockGroupRow = {
  id: 'group-uuid',
  name: 'Aventureros MX',
  deletedAt: null,
};

const mockGroupTripRow = {
  tripId: 'trip-uuid',
  groupId: 'group-uuid',
  addedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TripsService', () => {
  let service: TripsService;
  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripDestinationsFindFirst: jest.Mock;
  let mockGroupsFindFirst: jest.Mock;
  let mockGroupTripsFindFirst: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertOnConflictDoNothing: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(mockOrganizerParticipant);
    mockTripDestinationsFindFirst = jest.fn().mockResolvedValue(mockDestRow);
    mockGroupsFindFirst = jest.fn().mockResolvedValue(mockGroupRow);
    mockGroupTripsFindFirst = jest.fn().mockResolvedValue(mockGroupTripRow);

    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertReturning = jest.fn().mockResolvedValue([mockTripRow]);
    mockInsertOnConflictDoNothing = jest.fn().mockResolvedValue(undefined);
    mockInsertValues = jest.fn().mockReturnValue({
      returning: mockInsertReturning,
      onConflictDoNothing: mockInsertOnConflictDoNothing,
    });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
        callback({
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        }),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              tripDestinations: { findFirst: mockTripDestinationsFindFirst },
              groups: { findFirst: mockGroupsFindFirst },
              groupTrips: { findFirst: mockGroupTripsFindFirst },
            },
            select: mockSelect,
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  describe('createTrip', () => {
    it('runs transaction and returns trip response', async () => {
      const result = await service.createTrip(mockUser, createDto);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('trip-uuid');
      expect(result.name).toBe('Cancún 2026');
      expect(result.status).toBe(TripStatus.DRAFT);
      expect(result.requiresConfirmation).toBe(false);
      expect(result.feedbackOpenUntil).toBeNull();
    });

    it('inserts trip and participant inside transaction', async () => {
      await service.createTrip(mockUser, createDto);

      // insert called twice inside transaction: trip + participant
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('throws when trip insert returns empty array', async () => {
      mockInsertReturning.mockResolvedValueOnce([]);
      await expect(service.createTrip(mockUser, createDto)).rejects.toThrow(
        'Failed to create trip',
      );
    });
  });

  describe('getTrip', () => {
    it('returns trip response for existing trip', async () => {
      const result = await service.getTrip('trip-uuid');

      expect(result.id).toBe('trip-uuid');
    });

    it('throws NotFoundException for unknown trip', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.getTrip('unknown-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTrip', () => {
    it('applies patch and returns updated trip', async () => {
      const dto: UpdateTripDto = { name: 'Updated Name' };
      const result = await service.updateTrip(mockUser, 'trip-uuid', dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.id).toBe('trip-uuid');
    });

    it('applies patch with all fields set', async () => {
      const dto: UpdateTripDto = {
        name: 'New Name',
        description: 'desc',
        visibility: TripVisibility.PRIVATE,
        startDate: '2026-12-02',
        endDate: '2026-12-09',
        participantCapacity: 5,
        departureCountry: 'CO',
        departureCity: 'BOGOTA',
        landingCountry: 'CO',
        landingCity: 'CARTAGENA',
        defaultTimezone: 'America/Bogota',
        defaultCurrency: 'COP',
        itineraryNotes: 'notes',
      };
      const result = await service.updateTrip(mockUser, 'trip-uuid', dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.id).toBe('trip-uuid');
    });

    it('throws BadRequestException when trip is COMPLETED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });

      await expect(service.updateTrip(mockUser, 'trip-uuid', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when trip is CANCELLED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(service.updateTrip(mockUser, 'trip-uuid', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when reducing capacity below confirmed traveler count', async () => {
      // 5 confirmed travelers currently
      mockSelectWhere.mockResolvedValue([{ total: 5 }]);
      const dto: UpdateTripDto = { participantCapacity: 3 };

      await expect(service.updateTrip(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows capacity update when count query returns no rows (?? 0 fallback)', async () => {
      mockSelectWhere.mockResolvedValue([]);
      const dto: UpdateTripDto = { participantCapacity: 1 };

      const result = await service.updateTrip(mockUser, 'trip-uuid', dto);

      expect(result.id).toBe('trip-uuid');
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.updateTrip(mockUser, 'trip-uuid', { name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('skips update when dto is empty', async () => {
      await service.updateTrip(mockUser, 'trip-uuid', {});

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when endDate is before existing startDate', async () => {
      const dto: UpdateTripDto = { endDate: '2026-11-30' };

      await expect(service.updateTrip(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException for non-organizer even on COMPLETED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.updateTrip(mockUser, 'trip-uuid', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteTrip', () => {
    it('deletes trip for DRAFT + organizer', async () => {
      await service.deleteTrip(mockUser, 'trip-uuid');

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      // delete called twice inside transaction: announcements + trip
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException for unknown trip', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteTrip(mockUser, 'trip-uuid')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteTrip(mockUser, 'trip-uuid')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when organizer deletes non-DRAFT trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.OPEN });

      await expect(service.deleteTrip(mockUser, 'trip-uuid')).rejects.toThrow(ForbiddenException);
    });

    it('SUPPORT_ADMIN can delete non-DRAFT trip', async () => {
      const adminUser = { ...mockUser, platformRole: PlatformRole.SUPPORT_ADMIN };
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CONFIRMED });

      await expect(service.deleteTrip(adminUser, 'trip-uuid')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe('transitionStatus', () => {
    it('transitions DRAFT to OPEN when destinations exist', async () => {
      mockSelectWhere.mockResolvedValue([{ total: 1 }]);
      const dto: TransitionTripStatusDto = { status: TripStatus.OPEN };

      const result = await service.transitionStatus(mockUser, 'trip-uuid', dto);

      expect(mockUpdateSet).toHaveBeenCalledWith({ status: TripStatus.OPEN });
      expect(result.id).toBe('trip-uuid');
    });

    it('throws BadRequestException for DRAFT→OPEN without destinations', async () => {
      mockSelectWhere.mockResolvedValue([{ total: 0 }]);
      const dto: TransitionTripStatusDto = { status: TripStatus.OPEN };

      await expect(service.transitionStatus(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for invalid transition (OPEN→COMPLETED)', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.OPEN });
      const dto: TransitionTripStatusDto = { status: TripStatus.COMPLETED };

      await expect(service.transitionStatus(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for transition from COMPLETED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });
      const dto: TransitionTripStatusDto = { status: TripStatus.CANCELLED };

      await expect(service.transitionStatus(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for transition from CANCELLED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });
      const dto: TransitionTripStatusDto = { status: TripStatus.OPEN };

      await expect(service.transitionStatus(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      const dto: TransitionTripStatusDto = { status: TripStatus.CANCELLED };

      await expect(service.transitionStatus(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('computes feedbackOpenUntil on IN_PROGRESS→COMPLETED', async () => {
      mockTripsFindFirst
        .mockResolvedValueOnce({ ...mockTripRow, status: TripStatus.IN_PROGRESS })
        .mockResolvedValueOnce({
          ...mockTripRow,
          status: TripStatus.COMPLETED,
          endDate: '2026-12-08',
        });
      const dto: TransitionTripStatusDto = { status: TripStatus.COMPLETED };

      const result = await service.transitionStatus(mockUser, 'trip-uuid', dto);

      expect(result.feedbackOpenUntil).not.toBeNull();
      expect(new Date(result.feedbackOpenUntil!).getTime()).toBeGreaterThan(
        new Date('2026-12-08').getTime(),
      );
    });
  });

  describe('listDestinations', () => {
    it('returns destinations ordered by position', async () => {
      const mockOrderBy = jest.fn().mockResolvedValue([mockDestRow]);
      mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });

      const result = await service.listDestinations('trip-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('dest-uuid');
      expect(result[0]!.position).toBe(1);
      expect(result[0]!.countryCode).toBe('MX');
    });

    it('returns empty array when trip has no destinations', async () => {
      const mockOrderBy = jest.fn().mockResolvedValue([]);
      mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });

      const result = await service.listDestinations('trip-uuid');

      expect(result).toHaveLength(0);
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.listDestinations('trip-uuid')).rejects.toThrow(NotFoundException);
    });

    it('maps all destination fields correctly', async () => {
      const fullDest = { ...mockDestRow, label: 'Beach stop' };
      const mockOrderBy = jest.fn().mockResolvedValue([fullDest]);
      mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });

      const result = await service.listDestinations('trip-uuid');

      expect(result[0]).toEqual({
        id: 'dest-uuid',
        tripId: 'trip-uuid',
        position: 1,
        countryCode: 'MX',
        city: 'CANCUN',
        label: 'Beach stop',
        createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      });
    });
  });

  describe('addDestination', () => {
    const addDto: CreateDestinationDto = { countryCode: 'MX', city: 'CANCUN' };

    beforeEach(() => {
      mockInsertReturning.mockResolvedValue([mockDestRow]);
    });

    it('inserts destination with position = 1 when no existing destinations', async () => {
      // select max returns null for empty trip; ?? 0 fallback → nextPosition = 1
      mockSelectWhere.mockResolvedValue([{ maxPos: null }]);

      const result = await service.addDestination(mockUser, 'trip-uuid', addDto);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.id).toBe('dest-uuid');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('inserts destination with position = existing_count + 1', async () => {
      mockSelectWhere.mockResolvedValue([{ maxPos: 2 }]);

      const result = await service.addDestination(mockUser, 'trip-uuid', addDto);

      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { position: number };
      expect(insertedValues?.position).toBe(3);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('returns requiresConfirmation=true when trip is IN_PROGRESS', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.IN_PROGRESS });

      const result = await service.addDestination(mockUser, 'trip-uuid', addDto);

      expect(result.requiresConfirmation).toBe(true);
    });

    it('returns requiresConfirmation=true when trip is CONFIRMED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CONFIRMED });

      const result = await service.addDestination(mockUser, 'trip-uuid', addDto);

      expect(result.requiresConfirmation).toBe(true);
    });

    it('stores optional label when provided', async () => {
      const dto: CreateDestinationDto = { countryCode: 'MX', city: 'CANCUN', label: 'Beach stop' };

      await service.addDestination(mockUser, 'trip-uuid', dto);

      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { label: string | null };
      expect(insertedValues?.label).toBe('Beach stop');
    });

    it('throws ForbiddenException for COMPLETED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });

      await expect(service.addDestination(mockUser, 'trip-uuid', addDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for CANCELLED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(service.addDestination(mockUser, 'trip-uuid', addDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.addDestination(mockUser, 'trip-uuid', addDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.addDestination(mockUser, 'trip-uuid', addDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when insert returns empty array', async () => {
      mockInsertReturning.mockResolvedValue([]);

      await expect(service.addDestination(mockUser, 'trip-uuid', addDto)).rejects.toThrow(
        'Failed to insert destination',
      );
    });
  });

  describe('updateDestination', () => {
    beforeEach(() => {
      const mockReturning = jest.fn().mockResolvedValue([mockDestRow]);
      mockUpdateWhere.mockReturnValue({ returning: mockReturning });
    });

    it('updates provided fields and returns destination', async () => {
      const dto: UpdateDestinationDto = { city: 'PLAYA DEL CARMEN' };
      const updatedDest = { ...mockDestRow, city: 'PLAYA DEL CARMEN' };
      const mockReturning = jest.fn().mockResolvedValue([updatedDest]);
      mockUpdateWhere.mockReturnValue({ returning: mockReturning });

      const result = await service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.city).toBe('PLAYA DEL CARMEN');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('skips update when dto is empty and returns existing destination', async () => {
      const result = await service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', {});

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(result.id).toBe('dest-uuid');
    });

    it('returns requiresConfirmation=true when trip is IN_PROGRESS', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.IN_PROGRESS });

      const result = await service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', {
        city: 'TULUM',
      });

      expect(result.requiresConfirmation).toBe(true);
    });

    it('returns requiresConfirmation=true when trip is CONFIRMED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CONFIRMED });

      const result = await service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', {
        city: 'TULUM',
      });

      expect(result.requiresConfirmation).toBe(true);
    });

    it('throws NotFoundException when destination does not exist', async () => {
      mockTripDestinationsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', { city: 'TULUM' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for COMPLETED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });

      await expect(
        service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteDestination', () => {
    it('deletes destination when count is > 1', async () => {
      mockSelectWhere.mockResolvedValue([{ total: 2 }]);

      await expect(
        service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid'),
      ).resolves.toBeUndefined();

      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when deleting the last destination', async () => {
      mockSelectWhere.mockResolvedValue([{ total: 1 }]);

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        UnprocessableEntityException,
      );

      expect(mockDeleteWhere).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when count query returns 0', async () => {
      mockSelectWhere.mockResolvedValue([{ total: 0 }]);

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws NotFoundException when destination does not exist', async () => {
      mockTripDestinationsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for COMPLETED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for CANCELLED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reorderDestinations', () => {
    const dest2 = { ...mockDestRow, id: 'dest-uuid-2', position: 2 };

    it('reorders all destinations atomically in a transaction', async () => {
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid', 'dest-uuid-2'] };

      // First select: existing IDs check
      // Second select (via listDestinations): orderBy chain
      const mockOrderBy = jest.fn().mockResolvedValue([mockDestRow, dest2]);
      mockSelectWhere
        .mockReturnValueOnce(Promise.resolve([{ id: 'dest-uuid' }, { id: 'dest-uuid-2' }]))
        .mockReturnValue({ orderBy: mockOrderBy });

      const result = await service.reorderDestinations(mockUser, 'trip-uuid', dto);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('updates positions starting at 1', async () => {
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid-2', 'dest-uuid'] };

      const mockOrderBy = jest.fn().mockResolvedValue([dest2, mockDestRow]);
      mockSelectWhere
        .mockReturnValueOnce(Promise.resolve([{ id: 'dest-uuid' }, { id: 'dest-uuid-2' }]))
        .mockReturnValue({ orderBy: mockOrderBy });

      await service.reorderDestinations(mockUser, 'trip-uuid', dto);

      // First update call should set position=1 for the first id (dest-uuid-2)
      const firstSetCall = mockUpdateSet.mock.calls[0]?.[0] as { position: number };
      expect(firstSetCall?.position).toBe(1);
      // Second update call should set position=2 for the second id (dest-uuid)
      const secondSetCall = mockUpdateSet.mock.calls[1]?.[0] as { position: number };
      expect(secondSetCall?.position).toBe(2);
    });

    it('throws BadRequestException when destinationIds does not match trip destinations', async () => {
      const dto: ReorderDestinationsDto = {
        destinationIds: ['dest-uuid', 'dest-uuid-2', 'dest-uuid-3'],
      };
      mockSelectWhere.mockResolvedValue([{ id: 'dest-uuid' }, { id: 'dest-uuid-2' }]);

      await expect(service.reorderDestinations(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when destinationIds contains an ID not in the trip', async () => {
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid', 'wrong-uuid'] };
      mockSelectWhere.mockResolvedValue([{ id: 'dest-uuid' }, { id: 'dest-uuid-2' }]);

      await expect(service.reorderDestinations(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException for COMPLETED trip', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid'] };

      await expect(service.reorderDestinations(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid'] };

      await expect(service.reorderDestinations(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns IN_PROGRESS trip destinations without throwing', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.IN_PROGRESS });
      const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid'] };

      const mockOrderBy = jest.fn().mockResolvedValue([mockDestRow]);
      mockSelectWhere
        .mockReturnValueOnce(Promise.resolve([{ id: 'dest-uuid' }]))
        .mockReturnValue({ orderBy: mockOrderBy });

      // IN_PROGRESS is allowed — reorder proceeds (no requiresConfirmation on list response)
      const result = await service.reorderDestinations(mockUser, 'trip-uuid', dto);
      expect(result).toHaveLength(1);
    });
  });

  describe('listTripGroups', () => {
    it('returns mapped group-trip rows', async () => {
      mockSelectWhere.mockResolvedValue([mockGroupTripRow]);

      const result = await service.listTripGroups(mockUser, 'trip-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tripId: 'trip-uuid',
        groupId: 'group-uuid',
        addedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('returns empty array when no groups are linked', async () => {
      mockSelectWhere.mockResolvedValue([]);

      const result = await service.listTripGroups(mockUser, 'trip-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(service.listTripGroups(mockUser, 'trip-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(null);

      await expect(service.listTripGroups(mockUser, 'trip-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addTripGroup', () => {
    it('inserts and returns the group-trip row', async () => {
      mockSelectWhere.mockResolvedValue([mockGroupTripRow]);

      const result = await service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertOnConflictDoNothing).toHaveBeenCalled();
      expect(result).toEqual({
        tripId: 'trip-uuid',
        groupId: 'group-uuid',
        addedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('is idempotent — no error when group already linked', async () => {
      mockSelectWhere.mockResolvedValue([mockGroupTripRow]);
      mockInsertOnConflictDoNothing.mockResolvedValue(undefined);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockGroupsFindFirst.mockResolvedValue(null);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when group is soft-deleted', async () => {
      mockGroupsFindFirst.mockResolvedValue(null); // isNull(deletedAt) filter excludes it

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(null);

      await expect(
        service.addTripGroup(mockUser, 'trip-uuid', { groupId: 'group-uuid' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeTripGroup', () => {
    it('deletes the group-trip row', async () => {
      await service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(null);

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when group link does not exist', async () => {
      mockGroupTripsFindFirst.mockResolvedValue(null);

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(null);

      await expect(service.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
