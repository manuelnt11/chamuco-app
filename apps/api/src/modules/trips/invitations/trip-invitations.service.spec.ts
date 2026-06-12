import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));
import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripInvitationsService } from './trip-invitations.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type { CreateTripInvitationDto } from './dto/create-trip-invitation.dto';

const TRIP_ID = 'trip-uuid';
const ORGANIZER_ID = 'organizer-uuid';
const USER_ID = 'user-uuid';
const TARGET_ID = 'target-uuid';
const NOW = new Date('2026-01-01T00:00:00.000Z');

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
  initiatedBy: ORGANIZER_ID,
  initiatedAt: NOW,
  decidedBy: null,
  confirmedAt: null,
  updatedAt: NOW,
});

const invitedParticipation = makeParticipation(USER_ID, TripParticipantStatus.INVITED);
const activeParticipation = makeParticipation(USER_ID, TripParticipantStatus.CONFIRMED);
const organizerParticipation = makeParticipation(
  ORGANIZER_ID,
  TripParticipantStatus.CONFIRMED,
  TripRole.ORGANIZER,
);

const mockTargetUser = {
  id: TARGET_ID,
  username: 'target_user',
  displayName: 'Target User',
  avatar: null,
};
const mockOrganizerUser = {
  id: ORGANIZER_ID,
  username: 'organizer',
  displayName: 'Organizer',
  avatar: null,
};

describe('TripInvitationsService', () => {
  let service: TripInvitationsService;

  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindMany: jest.Mock;
  let mockUsersFindMany: jest.Mock;
  let mockUsersFindFirst: jest.Mock;
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
  let mockNotificationsNotifyMany: jest.Mock;
  let mockAssertTripOrganizer: jest.Mock;
  let mockFindParticipantOrThrow: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue({ name: 'Alps Adventure' });
    mockTripParticipantsFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindFirst = jest.fn().mockResolvedValue(mockOrganizerUser);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertValues = jest.fn().mockResolvedValue(undefined);
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    // assertCapacityAvailable: count() < capacity → no throw
    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockNotificationsNotifyMany = jest.fn().mockResolvedValue(undefined);
    mockAssertTripOrganizer = jest.fn().mockResolvedValue(undefined);
    mockFindParticipantOrThrow = jest.fn().mockResolvedValue(invitedParticipation);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripInvitationsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findMany: mockTripParticipantsFindMany },
              users: { findFirst: mockUsersFindFirst, findMany: mockUsersFindMany },
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
            assertTripOrganizer: mockAssertTripOrganizer,
            findParticipantOrThrow: mockFindParticipantOrThrow,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notifyMany: mockNotificationsNotifyMany },
        },
      ],
    }).compile();

    service = module.get<TripInvitationsService>(TripInvitationsService);
  });

  // ─── sendInvitations ─────────────────────────────────────────────────────────

  describe('sendInvitations', () => {
    const dto: CreateTripInvitationDto = { usernames: ['target_user'] };

    it('inserts new INVITED record and returns INVITED status', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.INVITED }),
      );
      expect(result).toEqual({ results: [{ username: 'target_user', status: 'INVITED' }] });
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [TARGET_ID],
        NotificationType.TRIP_INVITATION,
        { tripId: TRIP_ID, tripName: 'Alps Adventure' },
        [NotificationChannel.PUSH],
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockAssertTripOrganizer.mockRejectedValue(new ForbiddenException());

      await expect(service.sendInvitations(TRIP_ID, dto, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns NOT_FOUND when target user does not exist', async () => {
      mockUsersFindMany.mockResolvedValueOnce([]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'NOT_FOUND' }] });
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('returns ALREADY_MEMBER when target is CONFIRMED', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([
        makeParticipation(TARGET_ID, TripParticipantStatus.CONFIRMED),
      ]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'ALREADY_MEMBER' }] });
    });

    it('returns ALREADY_INVITED when target is INVITED', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([
        makeParticipation(TARGET_ID, TripParticipantStatus.INVITED),
      ]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(result).toEqual({ results: [{ username: 'target_user', status: 'ALREADY_INVITED' }] });
    });

    it('returns HAS_PENDING_REQUEST when target has PENDING_REQUEST', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([
        makeParticipation(TARGET_ID, TripParticipantStatus.PENDING_REQUEST),
      ]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(result).toEqual({
        results: [{ username: 'target_user', status: 'HAS_PENDING_REQUEST' }],
      });
    });

    it('re-invites after DECLINED, uses UPDATE → INVITED', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([
        makeParticipation(TARGET_ID, TripParticipantStatus.DECLINED),
      ]);

      const result = await service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.INVITED }),
      );
      expect(mockInsert).not.toHaveBeenCalled();
      expect(result).toEqual({ results: [{ username: 'target_user', status: 'INVITED' }] });
    });

    it('logs error and resolves when notifyMany throws', async () => {
      mockUsersFindMany.mockResolvedValueOnce([mockTargetUser]);
      mockTripParticipantsFindMany.mockResolvedValueOnce([]);
      mockNotificationsNotifyMany.mockRejectedValueOnce(new Error('FCM blip'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(service.sendInvitations(TRIP_ID, dto, ORGANIZER_ID)).resolves.toBeDefined();
      expect(logSpy).toHaveBeenCalledWith(
        'Failed to send TRIP_INVITATION notifications',
        expect.any(Error),
      );
    });
  });

  // ─── acceptInvitation ────────────────────────────────────────────────────────

  describe('acceptInvitation', () => {
    it('transitions INVITED → ACCEPTED, sets confirmedAt, and notifies organizers', async () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);

      await service.acceptInvitation(TRIP_ID, USER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.ACCEPTED }),
      );
      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [ORGANIZER_ID],
        NotificationType.TRIP_INVITATION_ACCEPTED,
        expect.objectContaining({ tripId: TRIP_ID }),
        [NotificationChannel.PUSH],
      );
    });

    it('throws ConflictException when participation is not INVITED', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(activeParticipation);

      await expect(service.acceptInvitation(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when participant not found', async () => {
      mockFindParticipantOrThrow.mockRejectedValue(
        new NotFoundException('Participation record not found'),
      );

      await expect(service.acceptInvitation(TRIP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when trip is at capacity', async () => {
      mockTripsFindFirst.mockResolvedValue({ participantCapacity: 1 });
      mockSelectWhere.mockResolvedValueOnce([{ total: 1 }]); // at capacity

      await expect(service.acceptInvitation(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('skips organizer notification when no active organizers', async () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([]); // no organizers

      await service.acceptInvitation(TRIP_ID, USER_ID);

      expect(mockNotificationsNotifyMany).not.toHaveBeenCalled();
    });

    it('uses empty string for tripName when trip query returns null', async () => {
      mockTripsFindFirst.mockResolvedValue(null); // trip not found in notification query
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);

      await service.acceptInvitation(TRIP_ID, USER_ID);

      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tripName: '' }),
        expect.anything(),
      );
    });

    it('uses empty string for username when acceptingUser query returns null', async () => {
      mockUsersFindFirst.mockResolvedValue(null);
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);

      await service.acceptInvitation(TRIP_ID, USER_ID);

      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ username: '' }),
        expect.anything(),
      );
    });

    it('resolves even if notifyMany throws', async () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);
      mockNotificationsNotifyMany.mockRejectedValueOnce(new Error('FCM'));

      await expect(service.acceptInvitation(TRIP_ID, USER_ID)).resolves.toBeUndefined();
    });
  });

  // ─── declineInvitation ───────────────────────────────────────────────────────

  describe('declineInvitation', () => {
    it('transitions INVITED → DECLINED', async () => {
      await service.declineInvitation(TRIP_ID, USER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.DECLINED }),
      );
    });

    it('throws ConflictException when participation is not INVITED', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(activeParticipation);

      await expect(service.declineInvitation(TRIP_ID, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when participant not found', async () => {
      mockFindParticipantOrThrow.mockRejectedValue(new NotFoundException());

      await expect(service.declineInvitation(TRIP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── revokeInvitation ────────────────────────────────────────────────────────

  describe('revokeInvitation', () => {
    it('deletes the INVITED row', async () => {
      await service.revokeInvitation(TRIP_ID, USER_ID, ORGANIZER_ID);

      expect(mockAssertTripOrganizer).toHaveBeenCalledWith(TRIP_ID, ORGANIZER_ID);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockAssertTripOrganizer.mockRejectedValue(new ForbiddenException());

      await expect(service.revokeInvitation(TRIP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when target is not INVITED', async () => {
      mockFindParticipantOrThrow.mockResolvedValue(activeParticipation);

      await expect(service.revokeInvitation(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when participant not found', async () => {
      mockFindParticipantOrThrow.mockRejectedValue(new NotFoundException());

      await expect(service.revokeInvitation(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
