import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('TripsService', () => {
  let service: TripsService;
  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(mockOrganizerParticipant);

    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockInsertReturning = jest.fn().mockResolvedValue([mockTripRow]);
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
        callback({
          insert: mockInsert,
          update: mockUpdate,
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
            },
            select: mockSelect,
            update: mockUpdate,
            insert: mockInsert,
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

  describe('cancelTrip', () => {
    it('sets status to CANCELLED', async () => {
      await service.cancelTrip(mockUser, 'trip-uuid');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ status: TripStatus.CANCELLED });
    });

    it('throws BadRequestException when already COMPLETED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });

      await expect(service.cancelTrip(mockUser, 'trip-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when already CANCELLED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(service.cancelTrip(mockUser, 'trip-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for non-organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.cancelTrip(mockUser, 'trip-uuid')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for unknown trip', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.cancelTrip(mockUser, 'trip-uuid')).rejects.toThrow(NotFoundException);
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
});
