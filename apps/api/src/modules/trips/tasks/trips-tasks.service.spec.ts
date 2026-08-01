import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TripParticipantStatus,
  TripRole,
  TripStatus,
  TripTaskScope,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripsTasksService } from './trips-tasks.service';
import { TripsService } from '@/modules/trips/trips.service';
import type { CreateTripTaskDto } from './dto/create-trip-task.dto';
import type { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import type { SetTripTaskCompletionDto } from './dto/set-trip-task-completion.dto';
import { makeAuthenticatedUser } from '@/test/fixtures/user.fixture';

const mockUser = makeAuthenticatedUser();

const mockTripRow = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: null,
  cover: null,
  status: TripStatus.OPEN,
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
  createdBy: 'organizer-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockActiveParticipant = {
  tripId: 'trip-uuid',
  userId: mockUser.id,
  role: TripRole.PARTICIPANT,
  status: TripParticipantStatus.CONFIRMED,
};

const mockSharedTask = {
  id: 'shared-task-uuid',
  tripId: 'trip-uuid',
  ownerId: null,
  title: 'Book the group van',
  completedAt: null,
  createdBy: 'organizer-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockPersonalTask = {
  id: 'personal-task-uuid',
  tripId: 'trip-uuid',
  ownerId: mockUser.id,
  title: 'Pack sunscreen',
  completedAt: null,
  createdBy: mockUser.id,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TripsTasksService', () => {
  let service: TripsTasksService;
  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripTasksFindFirst: jest.Mock;
  let mockTripTasksFindMany: jest.Mock;
  let mockTripTaskCompletionsFindFirst: jest.Mock;
  let mockTripTaskCompletionsFindMany: jest.Mock;
  let mockUpdateReturning: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertOnConflictDoNothing: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockInsert: jest.Mock;
  let mockAssertOrganizerRole: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(mockActiveParticipant);
    mockTripTasksFindFirst = jest.fn().mockResolvedValue(mockSharedTask);
    mockTripTasksFindMany = jest.fn().mockResolvedValue([mockSharedTask, mockPersonalTask]);
    mockTripTaskCompletionsFindFirst = jest.fn().mockResolvedValue(undefined);
    mockTripTaskCompletionsFindMany = jest.fn().mockResolvedValue([]);

    mockUpdateReturning = jest.fn().mockResolvedValue([mockSharedTask]);
    mockUpdateSet = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: mockUpdateReturning }),
    });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

    mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockInsertReturning = jest.fn().mockResolvedValue([mockSharedTask]);
    mockInsertOnConflictDoNothing = jest.fn().mockResolvedValue(undefined);
    mockInsertValues = jest.fn().mockReturnValue({
      returning: mockInsertReturning,
      onConflictDoNothing: mockInsertOnConflictDoNothing,
    });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });

    mockAssertOrganizerRole = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsTasksService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              tripTasks: { findFirst: mockTripTasksFindFirst, findMany: mockTripTasksFindMany },
              tripTaskCompletions: {
                findFirst: mockTripTaskCompletionsFindFirst,
                findMany: mockTripTaskCompletionsFindMany,
              },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
          },
        },
        {
          provide: TripsService,
          useValue: { assertOrganizerRole: mockAssertOrganizerRole },
        },
      ],
    }).compile();

    service = module.get<TripsTasksService>(TripsTasksService);
  });

  describe('listTasks', () => {
    it('returns shared and personal tasks with completed resolved', async () => {
      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'shared-task-uuid', scope: TripTaskScope.SHARED });
      expect(result[1]).toMatchObject({ id: 'personal-task-uuid', scope: TripTaskScope.PERSONAL });
    });

    it('marks a shared task completed when a completion row exists for the user', async () => {
      mockTripTaskCompletionsFindMany.mockResolvedValue([
        { taskId: 'shared-task-uuid', userId: mockUser.id },
      ]);

      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(result[0]?.completed).toBe(true);
    });

    it('marks a personal task completed when completedAt is set', async () => {
      mockTripTasksFindMany.mockResolvedValue([{ ...mockPersonalTask, completedAt: new Date() }]);

      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(result[0]?.completed).toBe(true);
    });

    it('throws NotFoundException when trip does not exist', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.listTasks(mockUser, 'trip-uuid')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not an active participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.listTasks(mockUser, 'trip-uuid')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createTask', () => {
    it('creates a SHARED task after verifying organizer role', async () => {
      const dto: CreateTripTaskDto = { scope: TripTaskScope.SHARED, title: 'Book the group van' };

      const result = await service.createTask(mockUser, 'trip-uuid', dto);

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { ownerId: string | null };
      expect(insertedValues.ownerId).toBeNull();
      expect(result.scope).toBe(TripTaskScope.SHARED);
      expect(result.completed).toBe(false);
    });

    it('creates a PERSONAL task owned by the requesting user without an organizer check', async () => {
      mockInsertReturning.mockResolvedValue([mockPersonalTask]);
      const dto: CreateTripTaskDto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };

      const result = await service.createTask(mockUser, 'trip-uuid', dto);

      expect(mockAssertOrganizerRole).not.toHaveBeenCalled();
      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { ownerId: string | null };
      expect(insertedValues.ownerId).toBe(mockUser.id);
      expect(result.scope).toBe(TripTaskScope.PERSONAL);
    });

    it('throws ForbiddenException when creating SHARED without organizer role', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());
      const dto: CreateTripTaskDto = { scope: TripTaskScope.SHARED, title: 'Book the group van' };

      await expect(service.createTask(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when trip is COMPLETED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });
      const dto: CreateTripTaskDto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };

      await expect(service.createTask(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when user is not an active participant', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      const dto: CreateTripTaskDto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };

      await expect(service.createTask(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateTaskTitle', () => {
    const dto: UpdateTripTaskDto = { title: 'Book the group van (updated)' };

    it('updates a SHARED task after verifying organizer role', async () => {
      const result = await service.updateTaskTitle(mockUser, 'trip-uuid', 'shared-task-uuid', dto);

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(result.id).toBe('shared-task-uuid');
    });

    it('updates a PERSONAL task when the requester is the owner', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockPersonalTask);
      mockUpdateReturning.mockResolvedValue([mockPersonalTask]);

      const result = await service.updateTaskTitle(
        mockUser,
        'trip-uuid',
        'personal-task-uuid',
        dto,
      );

      expect(mockAssertOrganizerRole).not.toHaveBeenCalled();
      expect(result.id).toBe('personal-task-uuid');
    });

    it('throws ForbiddenException when requester does not own the PERSONAL task', async () => {
      mockTripTasksFindFirst.mockResolvedValue({ ...mockPersonalTask, ownerId: 'other-user-uuid' });

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'personal-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockTripTasksFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'missing-task-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when trip is CANCELLED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setCompletion', () => {
    it('SHARED task: inserts a completion row for the requesting user when completed=true', async () => {
      const dto: SetTripTaskCompletionDto = { completed: true };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'shared-task-uuid', dto);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith({
        taskId: 'shared-task-uuid',
        userId: mockUser.id,
      });
      expect(result.completed).toBe(true);
    });

    it('SHARED task: deletes the completion row when completed=false', async () => {
      const dto: SetTripTaskCompletionDto = { completed: false };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'shared-task-uuid', dto);

      expect(mockDelete).toHaveBeenCalled();
      expect(result.completed).toBe(false);
    });

    it('PERSONAL task: owner sets completedAt', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockPersonalTask);
      mockUpdateReturning.mockResolvedValue([{ ...mockPersonalTask, completedAt: new Date() }]);
      const dto: SetTripTaskCompletionDto = { completed: true };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'personal-task-uuid', dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.completed).toBe(true);
    });

    it('PERSONAL task: throws ForbiddenException for a non-owner', async () => {
      mockTripTasksFindFirst.mockResolvedValue({ ...mockPersonalTask, ownerId: 'other-user-uuid' });
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'personal-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when trip is COMPLETED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.COMPLETED });
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockTripTasksFindFirst.mockResolvedValue(undefined);
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'missing-task-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTask', () => {
    it('deletes a SHARED task after verifying organizer role', async () => {
      await expect(
        service.deleteTask(mockUser, 'trip-uuid', 'shared-task-uuid'),
      ).resolves.toBeUndefined();

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('deletes a PERSONAL task when the requester is the owner', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockPersonalTask);

      await expect(
        service.deleteTask(mockUser, 'trip-uuid', 'personal-task-uuid'),
      ).resolves.toBeUndefined();

      expect(mockAssertOrganizerRole).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when requester does not own the PERSONAL task', async () => {
      mockTripTasksFindFirst.mockResolvedValue({ ...mockPersonalTask, ownerId: 'other-user-uuid' });

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'personal-task-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockTripTasksFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'missing-task-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when trip is CANCELLED', async () => {
      mockTripsFindFirst.mockResolvedValue({ ...mockTripRow, status: TripStatus.CANCELLED });

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'shared-task-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
