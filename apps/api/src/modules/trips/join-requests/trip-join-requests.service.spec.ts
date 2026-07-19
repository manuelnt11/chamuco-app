import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripJoinRequestsService } from './trip-join-requests.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

const TRIP_ID = 'trip-uuid';
const ORGANIZER_ID = 'organizer-uuid';
const USER_ID = 'user-uuid';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockPublicTrip = {
  id: TRIP_ID,
  name: 'Alps Adventure',
  visibility: TripVisibility.PUBLIC,
  participantCapacity: 10,
};

const makeParticipation = (
  userId: string,
  status: TripParticipantStatus,
  role: TripRole = TripRole.PARTICIPANT,
) => ({
  tripId: TRIP_ID,
  userId,
  status,
  role,
  isTraveler: true,
  initiatedBy: userId,
  initiatedAt: NOW,
  decidedBy: null,
  confirmedAt: null,
  updatedAt: NOW,
});

const requestParticipation = makeParticipation(USER_ID, TripParticipantStatus.PENDING_REQUEST);
const invitedParticipation = makeParticipation(USER_ID, TripParticipantStatus.INVITED);
const activeParticipation = makeParticipation(USER_ID, TripParticipantStatus.CONFIRMED);
const declinedParticipation = makeParticipation(USER_ID, TripParticipantStatus.DECLINED);

describe('TripJoinRequestsService', () => {
  let service: TripJoinRequestsService;

  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripsFindFirst: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockNotificationsNotify: jest.Mock;
  let mockAssertTripExists: jest.Mock;
  let mockAssertTripOrganizer: jest.Mock;
  let mockFindParticipantOrThrow: jest.Mock;
  let mockAssertCapacityAvailable: jest.Mock;

  beforeEach(async () => {
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(undefined);
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockPublicTrip);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertValues = jest.fn().mockResolvedValue(undefined);
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    // assertCapacityAvailable: 0 active travelers < capacity 10 → passes
    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockNotificationsNotify = jest.fn().mockResolvedValue(undefined);
    mockAssertTripExists = jest.fn().mockResolvedValue(mockPublicTrip);
    mockAssertTripOrganizer = jest.fn().mockResolvedValue(undefined);
    mockFindParticipantOrThrow = jest.fn().mockResolvedValue(requestParticipation);
    mockAssertCapacityAvailable = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripJoinRequestsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              trips: { findFirst: mockTripsFindFirst },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            select: mockSelect,
          },
        },
        {
          provide: TripParticipantsService,
          useValue: {
            assertTripExists: mockAssertTripExists,
            assertTripOrganizer: mockAssertTripOrganizer,
            findParticipantOrThrow: mockFindParticipantOrThrow,
            assertCapacityAvailable: mockAssertCapacityAvailable,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notify: mockNotificationsNotify },
        },
      ],
    }).compile();

    service = module.get<TripJoinRequestsService>(TripJoinRequestsService);
  });

  // ─── submitJoinRequest ───────────────────────────────────────────────────────

  describe('submitJoinRequest', () => {
    it('inserts new PENDING_REQUEST when no existing record', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await service.submitJoinRequest(TRIP_ID, USER_ID);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TripParticipantStatus.PENDING_REQUEST,
          role: TripRole.PARTICIPANT,
        }),
      );
    });

    it('throws NotFoundException when trip not found', async () => {
      mockAssertTripExists.mockRejectedValue(new NotFoundException('Trip not found'));

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for non-public trips', async () => {
      mockAssertTripExists.mockResolvedValue({
        ...mockPublicTrip,
        visibility: TripVisibility.PRIVATE,
      });

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when already CONFIRMED', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when PENDING_REQUEST already exists', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(requestParticipation);

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('resets INVITED to PENDING_REQUEST', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(invitedParticipation);

      await service.submitJoinRequest(TRIP_ID, USER_ID);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.PENDING_REQUEST }),
      );
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('resets DECLINED to PENDING_REQUEST', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(declinedParticipation);

      await service.submitJoinRequest(TRIP_ID, USER_ID);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('throws ConflictException on concurrent duplicate insert (unique violation)', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      mockInsertValues.mockRejectedValueOnce({ code: '23505' });

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('rethrows non-unique DB errors on insert', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      mockInsertValues.mockRejectedValueOnce({ code: '42P01' });

      await expect(service.submitJoinRequest(TRIP_ID, USER_ID)).rejects.toMatchObject({
        code: '42P01',
      });
    });
  });

  // ─── acceptJoinRequest ───────────────────────────────────────────────────────

  describe('acceptJoinRequest', () => {
    it('transitions PENDING_REQUEST → ACCEPTED and notifies requester', async () => {
      await service.acceptJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID);

      expect(mockAssertTripOrganizer).toHaveBeenCalledWith(TRIP_ID, ORGANIZER_ID);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.ACCEPTED }),
      );
      expect(mockNotificationsNotify).toHaveBeenCalledWith(
        USER_ID,
        NotificationType.TRIP_JOIN_ACCEPTED,
        expect.objectContaining({ tripId: TRIP_ID }),
        [NotificationChannel.PUSH],
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockAssertTripOrganizer.mockRejectedValue(new ForbiddenException());

      await expect(service.acceptJoinRequest(TRIP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when participant not found', async () => {
      mockFindParticipantOrThrow.mockRejectedValue(new NotFoundException());

      await expect(service.acceptJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when status is not PENDING_REQUEST', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(invitedParticipation);

      await expect(service.acceptJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when trip is at capacity', async () => {
      mockAssertCapacityAvailable.mockRejectedValueOnce(
        new ConflictException('Trip has reached maximum participant capacity'),
      );

      await expect(service.acceptJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('resolves even if notify throws', async () => {
      mockNotificationsNotify.mockRejectedValueOnce(new Error('FCM'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(
        service.acceptJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID),
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith(
        'Failed to send TRIP_JOIN_ACCEPTED notification',
        expect.any(Error),
      );
    });
  });

  // ─── rejectJoinRequest ───────────────────────────────────────────────────────

  describe('rejectJoinRequest', () => {
    it('transitions PENDING_REQUEST → DECLINED', async () => {
      await service.rejectJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.DECLINED }),
      );
    });

    it('throws ConflictException when status is not PENDING_REQUEST', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(activeParticipation);

      await expect(service.rejectJoinRequest(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockAssertTripOrganizer.mockRejectedValue(new ForbiddenException());

      await expect(service.rejectJoinRequest(TRIP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── withdrawJoinRequest ─────────────────────────────────────────────────────

  describe('withdrawJoinRequest', () => {
    it('deletes the PENDING_REQUEST row', async () => {
      await service.withdrawJoinRequest(TRIP_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws ConflictException when no PENDING_REQUEST exists', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(activeParticipation);

      await expect(service.withdrawJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when participant not found', async () => {
      mockFindParticipantOrThrow.mockRejectedValue(new NotFoundException());

      await expect(service.withdrawJoinRequest(TRIP_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
