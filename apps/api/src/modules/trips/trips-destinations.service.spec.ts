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
import { TripsDestinationsService } from './trips-destinations.service';
import { TripsService } from './trips.service';
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

const mockOrganizerParticipant = {
  tripId: 'trip-uuid',
  userId: 'user-uuid',
  role: TripRole.ORGANIZER,
  status: TripParticipantStatus.CONFIRMED,
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

describe('TripsDestinationsService', () => {
  let service: TripsDestinationsService;
  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripDestinationsFindFirst: jest.Mock;
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
  let mockAssertOrganizerRole: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(mockOrganizerParticipant);
    mockTripDestinationsFindFirst = jest.fn().mockResolvedValue(mockDestRow);

    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertReturning = jest.fn().mockResolvedValue([mockDestRow]);
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

    mockAssertOrganizerRole = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsDestinationsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              tripDestinations: { findFirst: mockTripDestinationsFindFirst },
            },
            select: mockSelect,
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: mockTransaction,
          },
        },
        {
          provide: TripsService,
          useValue: { assertOrganizerRole: mockAssertOrganizerRole },
        },
      ],
    }).compile();

    service = module.get<TripsDestinationsService>(TripsDestinationsService);
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
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

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
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

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
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());

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
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());
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
});
