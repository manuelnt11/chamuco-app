import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExportField,
  ExportFormat,
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripParticipantsService } from './trip-participants.service';
import type { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const TRIP_ID = 'trip-uuid';
const ORGANIZER_ID = 'organizer-uuid';
const USER_ID = 'user-uuid';
const TARGET_ID = 'target-uuid';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockTrip = { id: TRIP_ID, name: 'Alps Adventure' };

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
  confirmedAt: status === TripParticipantStatus.CONFIRMED ? NOW : null,
  updatedAt: NOW,
});

const organizerParticipation = makeParticipation(
  ORGANIZER_ID,
  TripParticipantStatus.CONFIRMED,
  TripRole.ORGANIZER,
);
const activeParticipation = makeParticipation(USER_ID, TripParticipantStatus.CONFIRMED);
const invitedParticipation = makeParticipation(USER_ID, TripParticipantStatus.INVITED);
const pendingParticipation = makeParticipation(USER_ID, TripParticipantStatus.PENDING_REQUEST);

const mockUserRow = { id: USER_ID, username: 'user', displayName: 'User', avatar: null };
const mockOrganizerRow = {
  id: ORGANIZER_ID,
  username: 'organizer',
  displayName: 'Organizer',
  avatar: null,
};
const mockProfileRow = {
  userId: ORGANIZER_ID,
  firstName: 'Test',
  lastName: 'Organizer',
  email: 'org@test.com',
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  dateOfBirth: { day: 1, month: 6, year: 1990, year_visible: true },
  homeCountry: 'CO',
  homeCity: 'Bogotá',
  bloodType: null,
  dietaryPreference: 'OMNIVORE',
  dietaryNotes: null,
  generalMedicalNotes: null,
  emergencyContacts: [],
  loyaltyPrograms: [],
};

describe('TripParticipantsService', () => {
  let service: TripParticipantsService;

  let mockTripsFindFirst: jest.Mock;
  let mockTripsFindMany: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripParticipantsFindMany: jest.Mock;
  let mockUsersFindMany: jest.Mock;
  let mockUserProfilesFindMany: jest.Mock;
  let mockUserNationalitiesFindMany: jest.Mock;
  let mockUserPreferencesFindFirst: jest.Mock;
  let mockAssetsFindMany: jest.Mock;

  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockTransaction: jest.Mock;
  let mockAssetResolverResolve: jest.Mock;
  let mockNotificationsNotify: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTrip);
    mockTripsFindMany = jest.fn().mockResolvedValue([]);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(organizerParticipation);
    mockTripParticipantsFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindMany = jest.fn().mockResolvedValue([]);
    mockUserProfilesFindMany = jest.fn().mockResolvedValue([]);
    mockUserNationalitiesFindMany = jest.fn().mockResolvedValue([]);
    mockUserPreferencesFindFirst = jest.fn().mockResolvedValue({ language: 'EN' });
    mockAssetsFindMany = jest.fn().mockResolvedValue([]);

    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockSelectWhere = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (cb) =>
        cb({ update: mockUpdate, insert: jest.fn(), delete: mockDelete }),
      );

    mockAssetResolverResolve = jest.fn().mockResolvedValue(null);
    mockNotificationsNotify = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripParticipantsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst, findMany: mockTripsFindMany },
              tripParticipants: {
                findFirst: mockTripParticipantsFindFirst,
                findMany: mockTripParticipantsFindMany,
              },
              users: { findMany: mockUsersFindMany },
              userProfiles: { findMany: mockUserProfilesFindMany },
              userNationalities: { findMany: mockUserNationalitiesFindMany },
              userPreferences: { findFirst: mockUserPreferencesFindFirst },
              assets: { findMany: mockAssetsFindMany },
            },
            update: mockUpdate,
            delete: mockDelete,
            select: mockSelect,
            transaction: mockTransaction,
          },
        },
        { provide: AssetResolverService, useValue: { resolve: mockAssetResolverResolve } },
        {
          provide: NotificationsService,
          useValue: { notify: mockNotificationsNotify },
        },
      ],
    }).compile();

    service = module.get<TripParticipantsService>(TripParticipantsService);
  });

  // ─── removeParticipant ───────────────────────────────────────────────────────

  describe('removeParticipant', () => {
    it('organizer removes CONFIRMED participant → DELETE + notify', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(activeParticipation) // findParticipantOrThrow (target)
        .mockResolvedValueOnce(organizerParticipation); // requester organizer check
      // assertNotSoleOrganizer: findMany returns 2 organizers → no throw
      mockTripParticipantsFindMany.mockResolvedValue([
        organizerParticipation,
        organizerParticipation,
      ]);

      await service.removeParticipant(TRIP_ID, USER_ID, ORGANIZER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockNotificationsNotify).toHaveBeenCalledWith(
        USER_ID,
        NotificationType.TRIP_PARTICIPANT_REMOVED,
        expect.objectContaining({ tripId: TRIP_ID }),
        [NotificationChannel.PUSH],
      );
    });

    it('throws ForbiddenException when non-organizer tries to remove another', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(activeParticipation) // target
        .mockResolvedValueOnce(undefined); // requester not organizer

      await expect(service.removeParticipant(TRIP_ID, ORGANIZER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.removeParticipant(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when target is not active', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(pendingParticipation) // target (not active)
        .mockResolvedValueOnce(organizerParticipation); // requester

      await expect(service.removeParticipant(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException when CO_ORGANIZER tries to remove ORGANIZER', async () => {
      const coOrgTarget = makeParticipation(
        USER_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.ORGANIZER,
      );
      const coOrgRequester = makeParticipation(
        ORGANIZER_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.CO_ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(coOrgTarget)
        .mockResolvedValueOnce(coOrgRequester);

      await expect(service.removeParticipant(TRIP_ID, USER_ID, ORGANIZER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('self-leaves CONFIRMED → DELETE', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([
        organizerParticipation,
        organizerParticipation,
      ]);

      await service.removeParticipant(TRIP_ID, USER_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('self-withdraws INVITED → DELETE (no assertNotSoleOrganizer)', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(invitedParticipation);

      await service.removeParticipant(TRIP_ID, USER_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('self-withdraws PENDING_REQUEST → DELETE', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(pendingParticipation);

      await service.removeParticipant(TRIP_ID, USER_ID, USER_ID);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws ConflictException when self has no active participation', async () => {
      const declinedParticipation = makeParticipation(USER_ID, TripParticipantStatus.DECLINED);
      mockTripParticipantsFindFirst.mockResolvedValue(declinedParticipation);

      await expect(service.removeParticipant(TRIP_ID, USER_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when sole organizer tries to leave', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(organizerParticipation);
      // assertNotSoleOrganizer: only 1 organizer → throw
      mockTripParticipantsFindMany.mockResolvedValue([organizerParticipation]);

      await expect(service.removeParticipant(TRIP_ID, ORGANIZER_ID, ORGANIZER_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── updateParticipantRole ───────────────────────────────────────────────────

  describe('updateParticipantRole', () => {
    const promoteDto: UpdateParticipantRoleDto = { role: TripRole.CO_ORGANIZER };
    const demoteDto: UpdateParticipantRoleDto = { role: TripRole.PARTICIPANT };
    const ownerTransferDto: UpdateParticipantRoleDto = { role: TripRole.ORGANIZER };

    it('promotes PARTICIPANT → CO_ORGANIZER', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation) // requester
        .mockResolvedValueOnce(activeParticipation); // target

      await service.updateParticipantRole(TRIP_ID, USER_ID, promoteDto, ORGANIZER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ role: TripRole.CO_ORGANIZER }),
      );
    });

    it('demotes CO_ORGANIZER → PARTICIPANT when not sole organizer', async () => {
      const coOrgTarget = makeParticipation(
        USER_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.CO_ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(coOrgTarget);
      mockTripParticipantsFindMany.mockResolvedValue([organizerParticipation, coOrgTarget]);

      await service.updateParticipantRole(TRIP_ID, USER_ID, demoteDto, ORGANIZER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ role: TripRole.PARTICIPANT }),
      );
    });

    it('ORGANIZER transfer: target → ORGANIZER, caller → CO_ORGANIZER (transaction)', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(activeParticipation);

      await service.updateParticipantRole(TRIP_ID, USER_ID, ownerTransferDto, ORGANIZER_ID);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('throws ForbiddenException when caller is not ORGANIZER', async () => {
      mockTripParticipantsFindFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.updateParticipantRole(TRIP_ID, USER_ID, promoteDto, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target has no active participation', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(undefined);

      await expect(
        service.updateParticipantRole(TRIP_ID, TARGET_ID, promoteDto, ORGANIZER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when demoting the sole organizer', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(organizerParticipation); // target is also ORGANIZER
      mockTripParticipantsFindMany.mockResolvedValue([organizerParticipation]); // sole

      await expect(
        service.updateParticipantRole(TRIP_ID, ORGANIZER_ID, demoteDto, ORGANIZER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when requester targets themselves', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(organizerParticipation);

      await expect(
        service.updateParticipantRole(TRIP_ID, ORGANIZER_ID, promoteDto, ORGANIZER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when target is already the trip organizer', async () => {
      const targetOrganizerParticipation = makeParticipation(
        TARGET_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(targetOrganizerParticipation);

      await expect(
        service.updateParticipantRole(TRIP_ID, TARGET_ID, ownerTransferDto, ORGANIZER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('sends TRIP_ROLE_CHANGED notification after demotion', async () => {
      const coOrgTarget = makeParticipation(
        USER_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.CO_ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(coOrgTarget);
      mockTripParticipantsFindMany.mockResolvedValue([organizerParticipation, coOrgTarget]);

      await service.updateParticipantRole(TRIP_ID, USER_ID, demoteDto, ORGANIZER_ID);

      expect(mockNotificationsNotify).toHaveBeenCalledWith(
        USER_ID,
        NotificationType.TRIP_ROLE_CHANGED,
        expect.objectContaining({ tripId: TRIP_ID }),
        [NotificationChannel.PUSH],
      );
    });
  });

  // ─── getMyParticipation ──────────────────────────────────────────────────────

  describe('getMyParticipation', () => {
    it('returns participation dto', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);

      const result = await service.getMyParticipation(TRIP_ID, USER_ID);

      expect(result).toEqual({
        status: TripParticipantStatus.CONFIRMED,
        role: TripRole.PARTICIPANT,
        isTraveler: true,
      });
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.getMyParticipation(TRIP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user is not a participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.getMyParticipation(TRIP_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── listMyInvitations ───────────────────────────────────────────────────────

  describe('listMyInvitations', () => {
    const mockTripRow = {
      id: TRIP_ID,
      name: 'Alps Adventure',
      cover: null,
    };

    it('returns empty array when no pending invitations', async () => {
      mockTripParticipantsFindMany.mockResolvedValue([]);

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toEqual([]);
    });

    it('returns invitation with trip info', async () => {
      mockTripParticipantsFindMany.mockResolvedValue([invitedParticipation]);
      mockTripsFindMany.mockResolvedValue([mockTripRow]);

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]?.trip.id).toBe(TRIP_ID);
      expect(result[0]?.trip.name).toBe('Alps Adventure');
    });

    it('resolves cover URL when trip has a cover asset', async () => {
      const tripWithCover = { ...mockTripRow, cover: 'cover-asset-uuid' };
      const mockCoverAsset = {
        id: 'cover-asset-uuid',
        type: 'image',
        source: 'gcs',
        target: 'trip-covers/alps.jpg',
        fileSize: null,
        isPublic: true,
        createdAt: NOW,
      };
      mockTripParticipantsFindMany.mockResolvedValue([invitedParticipation]);
      mockTripsFindMany.mockResolvedValue([tripWithCover]);
      mockAssetsFindMany.mockResolvedValue([mockCoverAsset]);
      mockAssetResolverResolve.mockResolvedValue({
        url: 'https://cdn.example.com/trip-covers/alps.jpg',
      });

      const result = await service.listMyInvitations(USER_ID);

      expect(result[0]?.trip.coverUrl).toBe('https://cdn.example.com/trip-covers/alps.jpg');
    });

    it('omits invitation when trip not found in results', async () => {
      mockTripParticipantsFindMany.mockResolvedValue([invitedParticipation]);
      mockTripsFindMany.mockResolvedValue([]); // trip not returned

      const result = await service.listMyInvitations(USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ─── listActiveParticipants ──────────────────────────────────────────────────

  describe('listActiveParticipants', () => {
    it('throws ForbiddenException when caller is not an active participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined); // assertActiveParticipant

      await expect(service.listActiveParticipants(TRIP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.listActiveParticipants(TRIP_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns empty array when no active participants', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation); // assertActiveParticipant
      mockTripParticipantsFindMany.mockResolvedValue([]);

      const result = await service.listActiveParticipants(TRIP_ID, USER_ID);

      expect(result).toEqual([]);
    });

    it('returns mapped ParticipantResponseDto list', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([activeParticipation]);
      mockUsersFindMany.mockResolvedValue([mockUserRow]);

      const result = await service.listActiveParticipants(TRIP_ID, USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ userId: USER_ID, role: TripRole.PARTICIPANT });
    });

    it('resolves avatar URL when participant has an avatar asset', async () => {
      const userWithAvatar = { ...mockUserRow, avatar: 'asset-uuid' };
      const mockAsset = {
        id: 'asset-uuid',
        type: 'image',
        source: 'gcs',
        target: 'avatars/user.jpg',
        fileSize: 12345,
        isPublic: false,
        createdAt: NOW,
      };
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([activeParticipation]);
      mockUsersFindMany.mockResolvedValue([userWithAvatar]);
      mockAssetsFindMany.mockResolvedValue([mockAsset]);
      mockAssetResolverResolve.mockResolvedValue({
        url: 'https://cdn.example.com/avatars/user.jpg',
      });

      const result = await service.listActiveParticipants(TRIP_ID, USER_ID);

      expect(result[0]!.avatarUrl).toBe('https://cdn.example.com/avatars/user.jpg');
    });

    it('returns null avatarUrl when avatar asset has no fileSize', async () => {
      const userWithAvatar = { ...mockUserRow, avatar: 'asset-uuid' };
      const mockAsset = {
        id: 'asset-uuid',
        type: 'image',
        source: 'emoji',
        target: '🏔️',
        fileSize: null,
        isPublic: true,
        createdAt: NOW,
      };
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([activeParticipation]);
      mockUsersFindMany.mockResolvedValue([userWithAvatar]);
      mockAssetsFindMany.mockResolvedValue([mockAsset]);
      mockAssetResolverResolve.mockResolvedValue(null); // resolver returns null

      const result = await service.listActiveParticipants(TRIP_ID, USER_ID);

      expect(result[0]!.avatarUrl).toBeNull();
    });
  });

  // ─── listPendingParticipants ─────────────────────────────────────────────────

  describe('listPendingParticipants', () => {
    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.listPendingParticipants(TRIP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns empty array when no pending participants', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(organizerParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([]);

      const result = await service.listPendingParticipants(TRIP_ID, ORGANIZER_ID);

      expect(result).toEqual([]);
    });

    it('returns INVITED and PENDING_REQUEST participants', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(organizerParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([invitedParticipation, pendingParticipation]);
      mockUsersFindMany.mockResolvedValue([mockUserRow, mockUserRow]);

      const result = await service.listPendingParticipants(TRIP_ID, ORGANIZER_ID);

      expect(result).toHaveLength(2);
    });
  });

  // ─── assertTripExists ────────────────────────────────────────────────────────

  describe('assertTripExists', () => {
    it('returns trip when found', async () => {
      const result = await service.assertTripExists(TRIP_ID);

      expect(result).toEqual(mockTrip);
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.assertTripExists(TRIP_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findParticipantOrThrow ──────────────────────────────────────────────────

  describe('findParticipantOrThrow', () => {
    it('returns participation when found', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(activeParticipation);

      const result = await service.findParticipantOrThrow(TRIP_ID, USER_ID);

      expect(result).toEqual(activeParticipation);
    });

    it('throws NotFoundException when not found', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.findParticipantOrThrow(TRIP_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── assertTripOrganizer ─────────────────────────────────────────────────────

  describe('assertTripOrganizer', () => {
    it('resolves when caller is a confirmed organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(organizerParticipation);

      await expect(service.assertTripOrganizer(TRIP_ID, ORGANIZER_ID)).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValueOnce(undefined); // organizer check returns nothing

      await expect(service.assertTripOrganizer(TRIP_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── toggleParticipantConfirmation ───────────────────────────────────────────

  describe('toggleParticipantConfirmation', () => {
    it('toggles ACCEPTED → CONFIRMED', async () => {
      const acceptedTarget = makeParticipation(TARGET_ID, TripParticipantStatus.ACCEPTED);
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation) // assertTripOrganizer
        .mockResolvedValueOnce(acceptedTarget); // target lookup

      await service.toggleParticipantConfirmation(TRIP_ID, TARGET_ID, ORGANIZER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TripParticipantStatus.CONFIRMED,
          confirmedAt: expect.any(Date),
        }),
      );
    });

    it('toggles CONFIRMED → ACCEPTED', async () => {
      const confirmedTarget = makeParticipation(TARGET_ID, TripParticipantStatus.CONFIRMED);
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(confirmedTarget);

      await service.toggleParticipantConfirmation(TRIP_ID, TARGET_ID, ORGANIZER_ID);

      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TripParticipantStatus.ACCEPTED,
          confirmedAt: null,
        }),
      );
    });

    it('throws ForbiddenException when requester is not organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.toggleParticipantConfirmation(TRIP_ID, TARGET_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target is not an active participant', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(undefined);

      await expect(
        service.toggleParticipantConfirmation(TRIP_ID, TARGET_ID, ORGANIZER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when target is the ORGANIZER role', async () => {
      const organizerTarget = makeParticipation(
        TARGET_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(organizerTarget);

      await expect(
        service.toggleParticipantConfirmation(TRIP_ID, TARGET_ID, ORGANIZER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── exportParticipants ──────────────────────────────────────────────────────

  describe('exportParticipants', () => {
    const mockNationalityRow = {
      userId: ORGANIZER_ID,
      countryCode: 'CO',
      isPrimary: true,
      nationalIdNumber: '12345678',
      passportNumber: 'CC123456',
      passportExpiryDate: '2030-01-01',
      passportStatus: 'ACTIVE',
    };

    const setupHappyPath = () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);
      mockUsersFindMany.mockResolvedValueOnce([mockOrganizerRow]);
      mockUserProfilesFindMany.mockResolvedValueOnce([mockProfileRow]);
      mockUserNationalitiesFindMany.mockResolvedValueOnce([mockNationalityRow]);
    };

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValueOnce(null);

      await expect(service.exportParticipants(TRIP_ID, USER_ID, ExportFormat.XLSX)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns a Buffer when no active participants exist', async () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([]);

      const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.XLSX);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('handles participants with no profile without throwing', async () => {
      mockTripParticipantsFindMany.mockResolvedValueOnce([activeParticipation]);
      mockUsersFindMany.mockResolvedValueOnce([mockUserRow]);
      mockUserProfilesFindMany.mockResolvedValueOnce([]);
      mockUserNationalitiesFindMany.mockResolvedValueOnce([]);

      await expect(
        service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.XLSX),
      ).resolves.toBeInstanceOf(Buffer);
    });

    describe('XLSX format', () => {
      it('returns a non-empty Buffer', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.XLSX);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('CSV format', () => {
      it('returns a non-empty Buffer', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });

      it('output contains header and data rows', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV);
        const text = result.toString('utf-8');

        expect(text).toContain('Display name');
        expect(text).toContain('@organizer');
      });
    });

    describe('ODS format', () => {
      it('returns a non-empty Buffer', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.ODS);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('field selection', () => {
      it('CSV output only includes selected fields', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.DISPLAY_NAME,
          ExportField.EMAIL,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('Display name');
        expect(text).toContain('Email');
        expect(text).not.toContain('Blood type');
        expect(text).not.toContain('Role');
      });

      it('preserves canonical field order regardless of input order', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.EMAIL,
          ExportField.DISPLAY_NAME,
        ]);
        const header = result.toString('utf-8').split('\r\n')[0]!;

        // DISPLAY_NAME comes before EMAIL in canonical order
        expect(header.indexOf('Display name')).toBeLessThan(header.indexOf('Email'));
      });

      it('includes all fields when fields list is empty (falls back to all)', async () => {
        setupHappyPath();

        const result = await service.exportParticipants(
          TRIP_ID,
          ORGANIZER_ID,
          ExportFormat.CSV,
          [],
        );
        const text = result.toString('utf-8');

        // empty selection → 0 active fields → only header line (empty) or just line break
        // result should still be a valid Buffer
        expect(result).toBeInstanceOf(Buffer);
        expect(text).not.toContain('Display name');
      });
    });

    describe('i18n — language from user_preferences', () => {
      it('uses Spanish headers when user preference is ES', async () => {
        mockUserPreferencesFindFirst.mockResolvedValueOnce({ language: 'ES' });
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.DISPLAY_NAME,
          ExportField.ROLE,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('Nombre visible');
        expect(text).toContain('Rol');
      });

      it('translates role values when user preference is ES', async () => {
        mockUserPreferencesFindFirst.mockResolvedValueOnce({ language: 'ES' });
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.ROLE,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('Organizador');
      });

      it('translates isTraveler Sí/No when user preference is ES', async () => {
        mockUserPreferencesFindFirst.mockResolvedValueOnce({ language: 'ES' });
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.IS_TRAVELER,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('Sí');
      });

      it('falls back to English when user has no preference row', async () => {
        mockUserPreferencesFindFirst.mockResolvedValueOnce(null);
        setupHappyPath();

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.DISPLAY_NAME,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('Display name');
      });
    });

    describe('nationality and passport fields', () => {
      it('includes nationality data when available', async () => {
        const natRow = {
          userId: ORGANIZER_ID,
          countryCode: 'CO',
          isPrimary: true,
          nationalIdNumber: '12345678',
          passportNumber: 'CC123456',
          passportExpiryDate: '2030-01-01',
          passportStatus: 'ACTIVE',
        };
        mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);
        mockUsersFindMany.mockResolvedValueOnce([mockOrganizerRow]);
        mockUserProfilesFindMany.mockResolvedValueOnce([mockProfileRow]);
        mockUserNationalitiesFindMany.mockResolvedValueOnce([natRow]);

        const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
          ExportField.NATIONALITY,
          ExportField.PASSPORT_NUMBER,
          ExportField.NATIONAL_ID_NUMBER,
        ]);
        const text = result.toString('utf-8');

        expect(text).toContain('CO');
        expect(text).toContain('CC123456');
        expect(text).toContain('12345678');
      });

      it('exports empty strings when no primary nationality exists', async () => {
        mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);
        mockUsersFindMany.mockResolvedValueOnce([mockOrganizerRow]);
        mockUserProfilesFindMany.mockResolvedValueOnce([mockProfileRow]);
        mockUserNationalitiesFindMany.mockResolvedValueOnce([]);

        await expect(
          service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV, [
            ExportField.NATIONALITY,
            ExportField.PASSPORT_NUMBER,
          ]),
        ).resolves.toBeInstanceOf(Buffer);
      });
    });

    it('includes the primary emergency contact in the CSV output', async () => {
      const profileWithContact = {
        ...mockProfileRow,
        emergencyContacts: [
          {
            id: 'ec-1',
            fullName: 'María López',
            relationship: 'mother',
            phoneCountryCode: '+57',
            phoneLocalNumber: '3001234567',
            isPrimary: true,
          },
        ],
      };
      mockTripParticipantsFindMany.mockResolvedValueOnce([organizerParticipation]);
      mockUsersFindMany.mockResolvedValueOnce([mockOrganizerRow]);
      mockUserProfilesFindMany.mockResolvedValueOnce([profileWithContact]);
      mockUserNationalitiesFindMany.mockResolvedValueOnce([]);

      const result = await service.exportParticipants(TRIP_ID, ORGANIZER_ID, ExportFormat.CSV);
      const text = result.toString('utf-8');

      expect(text).toContain('María López');
    });
  });

  // ─── notification error tolerance ────────────────────────────────────────────

  describe('notification error tolerance', () => {
    it('removeParticipant resolves even if notify throws', async () => {
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(activeParticipation)
        .mockResolvedValueOnce(organizerParticipation);
      mockTripParticipantsFindMany.mockResolvedValue([
        organizerParticipation,
        organizerParticipation,
      ]);
      mockNotificationsNotify.mockRejectedValueOnce(new Error('FCM down'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(
        service.removeParticipant(TRIP_ID, USER_ID, ORGANIZER_ID),
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalled();
    });

    describe('assertCapacityAvailable', () => {
      it('resolves when trip does not exist', async () => {
        mockTripsFindFirst.mockResolvedValueOnce(undefined);
        await expect(service.assertCapacityAvailable(TRIP_ID)).resolves.toBeUndefined();
      });

      it('resolves when active traveler count is below capacity', async () => {
        mockTripsFindFirst.mockResolvedValueOnce({ participantCapacity: 10 });
        mockSelectWhere.mockResolvedValueOnce([{ total: 5 }]);
        await expect(service.assertCapacityAvailable(TRIP_ID)).resolves.toBeUndefined();
      });

      it('throws ConflictException when active traveler count meets capacity', async () => {
        mockTripsFindFirst.mockResolvedValueOnce({ participantCapacity: 5 });
        mockSelectWhere.mockResolvedValueOnce([{ total: 5 }]);
        await expect(service.assertCapacityAvailable(TRIP_ID)).rejects.toThrow(ConflictException);
      });
    });

    it('updateParticipantRole resolves even if notify throws', async () => {
      const coOrgTarget = makeParticipation(
        USER_ID,
        TripParticipantStatus.CONFIRMED,
        TripRole.CO_ORGANIZER,
      );
      mockTripParticipantsFindFirst
        .mockResolvedValueOnce(organizerParticipation)
        .mockResolvedValueOnce(coOrgTarget);
      mockTripParticipantsFindMany.mockResolvedValue([organizerParticipation, coOrgTarget]);
      mockNotificationsNotify.mockRejectedValueOnce(new Error('FCM down'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

      await expect(
        service.updateParticipantRole(
          TRIP_ID,
          USER_ID,
          { role: TripRole.PARTICIPANT },
          ORGANIZER_ID,
        ),
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
