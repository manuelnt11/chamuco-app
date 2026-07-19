import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { TripAnnouncementsService } from './trip-announcements.service';
import type { CreateTripAnnouncementDto } from './dto/create-trip-announcement.dto';
import type { UpdateTripAnnouncementDto } from './dto/update-trip-announcement.dto';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const TRIP_ID = 'trip-uuid';
const ORGANIZER_ID = 'organizer-uuid';
const ORGANIZER_USERNAME = 'organizer-user';
const PARTICIPANT_ID = 'participant-uuid';
const ANNOUNCEMENT_ID = 'announcement-uuid';

const mockTrip = {
  id: TRIP_ID,
  name: 'Cartagena 2026',
  description: null,
  cover: null,
  status: TripStatus.OPEN,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-06-01',
  endDate: '2026-06-10',
  defaultTimezone: null,
  defaultCurrency: null,
  participantCapacity: 20,
  departureCountry: 'CO',
  departureCity: 'Bogotá',
  landingCountry: 'CO',
  landingCity: 'Cartagena',
  itineraryNotes: null,
  agencyId: null,
  createdBy: ORGANIZER_ID,
  createdAt: NOW,
  updatedAt: NOW,
};

const mockAnnouncement = {
  id: ANNOUNCEMENT_ID,
  tripId: TRIP_ID,
  createdBy: ORGANIZER_ID,
  createdByUsername: ORGANIZER_USERNAME,
  content: 'Trip departs Sunday at 6am.',
  createdAt: NOW,
  updatedAt: NOW,
};

const makeParticipant = (userId: string, role: TripRole, status: TripParticipantStatus) => ({
  tripId: TRIP_ID,
  userId,
  role,
  status,
  isTraveler: role === TripRole.PARTICIPANT,
  didTravel: null,
  initiatedAt: NOW,
  confirmedAt: null,
  updatedAt: NOW,
  initiatedBy: ORGANIZER_ID,
  decidedBy: null,
});

function makeChain<T>(resolveWith: T) {
  const chain = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    then(
      onFulfilled?: (value: T) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ): Promise<unknown> {
      return Promise.resolve(resolveWith).then(onFulfilled, onRejected);
    },
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  return chain;
}

describe('TripAnnouncementsService', () => {
  let service: TripAnnouncementsService;

  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripAnnouncementsFindFirst: jest.Mock;
  let mockUsersFindFirst: jest.Mock;

  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;

  let mockUpdateReturning: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;

  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;

  let mockSelect: jest.Mock;

  let mockNotificationsNotifyMany: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTrip);
    mockTripParticipantsFindFirst = jest
      .fn()
      .mockResolvedValue(
        makeParticipant(ORGANIZER_ID, TripRole.ORGANIZER, TripParticipantStatus.ACCEPTED),
      );
    mockTripAnnouncementsFindFirst = jest.fn().mockResolvedValue(mockAnnouncement);
    mockUsersFindFirst = jest.fn().mockResolvedValue({ username: ORGANIZER_USERNAME });

    mockInsertReturning = jest.fn().mockResolvedValue([mockAnnouncement]);
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockUpdateReturning = jest.fn().mockResolvedValue([mockAnnouncement]);
    mockUpdateWhere = jest.fn().mockReturnValue({ returning: mockUpdateReturning });
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockSelect = jest.fn().mockReturnValue(makeChain([{ userId: PARTICIPANT_ID }]));

    mockNotificationsNotifyMany = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripAnnouncementsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              tripAnnouncements: { findFirst: mockTripAnnouncementsFindFirst },
              users: { findFirst: mockUsersFindFirst },
            },
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
            select: mockSelect,
          },
        },
        {
          provide: NotificationsService,
          useValue: { notifyMany: mockNotificationsNotifyMany },
        },
      ],
    }).compile();

    service = module.get<TripAnnouncementsService>(TripAnnouncementsService);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateTripAnnouncementDto = { content: 'Trip departs Sunday at 6am.' };

    it('inserts announcement and returns DTO', async () => {
      const result = await service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ tripId: TRIP_ID, createdBy: ORGANIZER_ID, content: dto.content }),
      );
      expect(result.id).toBe(ANNOUNCEMENT_ID);
      expect(result.content).toBe(dto.content);
      expect(result.createdByUsername).toBe(ORGANIZER_USERNAME);
    });

    it('excludes the caller from notifyMany', async () => {
      mockSelect.mockReturnValue(makeChain([{ userId: PARTICIPANT_ID }, { userId: ORGANIZER_ID }]));

      await service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto);

      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        [PARTICIPANT_ID],
        NotificationType.TRIP_ANNOUNCEMENT,
        expect.objectContaining({ tripId: TRIP_ID }),
        [NotificationChannel.PUSH],
      );
    });

    it('does not throw when notifyMany rejects', async () => {
      mockNotificationsNotifyMany.mockRejectedValue(new Error('FCM down'));

      await expect(
        service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.create(TRIP_ID, PARTICIPANT_ID, ORGANIZER_USERNAME, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when caller is a regular participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.create(TRIP_ID, PARTICIPANT_ID, ORGANIZER_USERNAME, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when insert returns no row', async () => {
      mockInsertReturning.mockResolvedValue([]);

      await expect(service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto)).rejects.toThrow(
        'Failed to create announcement',
      );
    });

    it('throws BadRequestException when trip is DRAFT', async () => {
      mockTripsFindFirst
        .mockResolvedValueOnce(mockTrip)
        .mockResolvedValueOnce({ ...mockTrip, status: TripStatus.DRAFT });

      await expect(service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('uses empty string for tripName when trip lookup returns undefined', async () => {
      // 1. assertTripExists; 2. status check; 3. name lookup after insert
      mockTripsFindFirst
        .mockResolvedValueOnce(mockTrip)
        .mockResolvedValueOnce(mockTrip)
        .mockResolvedValueOnce(undefined);

      await service.create(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto);

      expect(mockNotificationsNotifyMany).toHaveBeenCalledWith(
        expect.any(Array),
        NotificationType.TRIP_ANNOUNCEMENT,
        expect.objectContaining({ tripName: '' }),
        [NotificationChannel.PUSH],
      );
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated announcements and total', async () => {
      const itemsChain = makeChain([mockAnnouncement]);
      const countChain = makeChain([{ value: 1 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(PARTICIPANT_ID, TripRole.PARTICIPANT, TripParticipantStatus.ACCEPTED),
      );

      const result = await service.findAll(TRIP_ID, PARTICIPANT_ID, { limit: 20, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe(ANNOUNCEMENT_ID);
      expect(result.total).toBe(1);
    });

    it('passes limit and offset to the query', async () => {
      const itemsChain = makeChain([]);
      const countChain = makeChain([{ value: 0 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(PARTICIPANT_ID, TripRole.PARTICIPANT, TripParticipantStatus.CONFIRMED),
      );

      await service.findAll(TRIP_ID, PARTICIPANT_ID, { limit: 5, offset: 10 });

      expect(itemsChain.limit).toHaveBeenCalledWith(5);
      expect(itemsChain.offset).toHaveBeenCalledWith(10);
    });

    it('uses defaults when limit/offset are undefined', async () => {
      const itemsChain = makeChain([]);
      const countChain = makeChain([{ value: 0 }]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(PARTICIPANT_ID, TripRole.PARTICIPANT, TripParticipantStatus.ACCEPTED),
      );

      await service.findAll(TRIP_ID, PARTICIPANT_ID, {});

      expect(itemsChain.limit).toHaveBeenCalledWith(20);
      expect(itemsChain.offset).toHaveBeenCalledWith(0);
    });

    it('throws NotFoundException when trip not found', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.findAll(TRIP_ID, PARTICIPANT_ID, {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is not an accepted or confirmed participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.findAll(TRIP_ID, PARTICIPANT_ID, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('defaults total to 0 when count query returns no rows', async () => {
      const itemsChain = makeChain([]);
      const countChain = makeChain([]);
      mockSelect.mockReturnValueOnce(itemsChain).mockReturnValueOnce(countChain);
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(PARTICIPANT_ID, TripRole.PARTICIPANT, TripParticipantStatus.ACCEPTED),
      );

      const result = await service.findAll(TRIP_ID, PARTICIPANT_ID, {});

      expect(result.total).toBe(0);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the announcement DTO', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(ORGANIZER_ID, TripRole.ORGANIZER, TripParticipantStatus.ACCEPTED),
      );
      mockSelect.mockReturnValue(makeChain([mockAnnouncement]));

      const result = await service.findOne(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID);

      expect(result.id).toBe(ANNOUNCEMENT_ID);
      expect(result.content).toBe(mockAnnouncement.content);
    });

    it('throws NotFoundException when announcement not found', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(
        makeParticipant(ORGANIZER_ID, TripRole.ORGANIZER, TripParticipantStatus.ACCEPTED),
      );
      mockSelect.mockReturnValue(makeChain([]));

      await expect(service.findOne(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not an accepted or confirmed participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.findOne(TRIP_ID, ANNOUNCEMENT_ID, PARTICIPANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const dto: UpdateTripAnnouncementDto = { content: 'Updated content.' };

    it('updates announcement and returns DTO', async () => {
      const result = await service.update(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID, dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ content: dto.content }));
      expect(result.id).toBe(ANNOUNCEMENT_ID);
    });

    it('throws NotFoundException when announcement not found', async () => {
      mockTripAnnouncementsFindFirst.mockResolvedValue(undefined);

      await expect(service.update(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.update(TRIP_ID, ANNOUNCEMENT_ID, PARTICIPANT_ID, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns empty string username when creator user not found', async () => {
      mockUsersFindFirst.mockResolvedValue(undefined);

      const result = await service.update(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID, dto);

      expect(result.createdByUsername).toBe('');
    });

    it('throws when update returns no row', async () => {
      mockUpdateReturning.mockResolvedValue([]);

      await expect(service.update(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID, dto)).rejects.toThrow(
        'Failed to update announcement',
      );
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes the announcement', async () => {
      await service.remove(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('throws NotFoundException when announcement not found', async () => {
      mockTripAnnouncementsFindFirst.mockResolvedValue(undefined);

      await expect(service.remove(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.remove(TRIP_ID, ANNOUNCEMENT_ID, PARTICIPANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
