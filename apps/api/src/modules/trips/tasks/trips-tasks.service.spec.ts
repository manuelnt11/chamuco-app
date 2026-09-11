import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PgDialect } from 'drizzle-orm/pg-core';
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
  scope: TripTaskScope.SHARED,
  title: 'Book the group van',
  completedAt: null,
  completedBy: null,
  createdBy: 'organizer-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockPersonalTask = {
  id: 'personal-task-uuid',
  tripId: 'trip-uuid',
  scope: TripTaskScope.PERSONAL,
  title: 'Pack sunscreen',
  completedAt: null,
  completedBy: null,
  createdBy: mockUser.id,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockOrganizerTask = {
  id: 'organizer-task-uuid',
  tripId: 'trip-uuid',
  scope: TripTaskScope.ORGANIZER,
  title: 'Secure permits',
  completedAt: null,
  completedBy: null,
  createdBy: 'organizer-uuid',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TripsTasksService', () => {
  let service: TripsTasksService;
  let mockTripsFindFirst: jest.Mock;
  let mockTripParticipantsFindFirst: jest.Mock;
  let mockTripTasksFindFirst: jest.Mock;
  let mockTripTaskCompletionsFindFirst: jest.Mock;
  let mockTripTaskCompletionsFindMany: jest.Mock;
  let mockUsersFindFirst: jest.Mock;
  let mockSelectOrderBy: jest.Mock;
  let mockSelectWhere: jest.Mock;
  let mockSelectLeftJoin: jest.Mock;
  let mockSelectFrom: jest.Mock;
  let mockSelect: jest.Mock;
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
  let mockIsOrganizerRole: jest.Mock;

  beforeEach(async () => {
    mockTripsFindFirst = jest.fn().mockResolvedValue(mockTripRow);
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(mockActiveParticipant);
    mockTripTasksFindFirst = jest.fn().mockResolvedValue(mockSharedTask);
    mockTripTaskCompletionsFindFirst = jest.fn().mockResolvedValue(undefined);
    mockTripTaskCompletionsFindMany = jest.fn().mockResolvedValue([]);
    mockUsersFindFirst = jest.fn().mockResolvedValue(undefined);

    mockSelectOrderBy = jest.fn().mockResolvedValue([
      { ...mockSharedTask, completedByUsername: null },
      { ...mockPersonalTask, completedByUsername: null },
    ]);
    mockSelectWhere = jest.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
    mockSelectLeftJoin = jest.fn().mockReturnValue({ where: mockSelectWhere });
    mockSelectFrom = jest.fn().mockReturnValue({ leftJoin: mockSelectLeftJoin });
    mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

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
    mockIsOrganizerRole = jest.fn().mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsTasksService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              trips: { findFirst: mockTripsFindFirst },
              tripParticipants: { findFirst: mockTripParticipantsFindFirst },
              tripTasks: { findFirst: mockTripTasksFindFirst },
              tripTaskCompletions: {
                findFirst: mockTripTaskCompletionsFindFirst,
                findMany: mockTripTaskCompletionsFindMany,
              },
              users: { findFirst: mockUsersFindFirst },
            },
            select: mockSelect,
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
          },
        },
        {
          provide: TripsService,
          useValue: {
            assertOrganizerRole: mockAssertOrganizerRole,
            isOrganizerRole: mockIsOrganizerRole,
          },
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
      mockSelectOrderBy.mockResolvedValue([
        { ...mockPersonalTask, completedAt: new Date(), completedByUsername: null },
      ]);

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

    it('includes ORGANIZER tasks when the requesting user is an organizer', async () => {
      mockIsOrganizerRole.mockResolvedValue(true);
      mockSelectOrderBy.mockResolvedValue([
        { ...mockSharedTask, completedByUsername: null },
        { ...mockPersonalTask, completedByUsername: null },
        { ...mockOrganizerTask, completedByUsername: null },
      ]);

      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(mockIsOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(result.map((t) => t.scope)).toContain(TripTaskScope.ORGANIZER);
    });

    it('excludes ORGANIZER tasks entirely when the requesting user is not an organizer', async () => {
      mockIsOrganizerRole.mockResolvedValue(false);

      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(result.map((t) => t.scope)).not.toContain(TripTaskScope.ORGANIZER);
    });

    it('resolves completedByUsername for a completed ORGANIZER task via the joined query', async () => {
      mockIsOrganizerRole.mockResolvedValue(true);
      mockSelectOrderBy.mockResolvedValue([
        {
          ...mockOrganizerTask,
          completedAt: new Date(),
          completedBy: 'organizer-uuid',
          completedByUsername: 'ana_organizer',
        },
      ]);

      const result = await service.listTasks(mockUser, 'trip-uuid');

      expect(result[0]?.completedByUsername).toBe('ana_organizer');
    });

    it('scopes the createdBy visibility clause to PERSONAL tasks only', async () => {
      mockIsOrganizerRole.mockResolvedValue(false);

      await service.listTasks(mockUser, 'trip-uuid');

      const whereArg = mockSelectWhere.mock.calls[0]?.[0] as Parameters<
        InstanceType<typeof PgDialect>['sqlToQuery']
      >[0];
      const { sql } = new PgDialect().sqlToQuery(whereArg);

      // A task the user created that ISN'T scoped to PERSONAL (e.g. an ORGANIZER task
      // created before losing the organizer role) must never match this clause on its
      // own — created_by may only appear ANDed with scope = PERSONAL, never as a bare
      // OR branch. Regression test for a visibility bypass: see PR review on #512.
      expect(sql).not.toMatch(/or\s+"trip_tasks"\."created_by"/);
      expect(sql).toMatch(/"trip_tasks"\."scope"\s*=\s*\$\d+\s+and\s+"trip_tasks"\."created_by"/);
    });
  });

  describe('createTask', () => {
    it('creates a SHARED task after verifying organizer role', async () => {
      const dto: CreateTripTaskDto = { scope: TripTaskScope.SHARED, title: 'Book the group van' };

      const result = await service.createTask(mockUser, 'trip-uuid', dto);

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { scope: TripTaskScope };
      expect(insertedValues.scope).toBe(TripTaskScope.SHARED);
      expect(result.scope).toBe(TripTaskScope.SHARED);
      expect(result.completed).toBe(false);
    });

    it('creates a PERSONAL task owned by the requesting user without an organizer check', async () => {
      mockInsertReturning.mockResolvedValue([mockPersonalTask]);
      const dto: CreateTripTaskDto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };

      const result = await service.createTask(mockUser, 'trip-uuid', dto);

      expect(mockAssertOrganizerRole).not.toHaveBeenCalled();
      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { scope: TripTaskScope };
      expect(insertedValues.scope).toBe(TripTaskScope.PERSONAL);
      expect(result.scope).toBe(TripTaskScope.PERSONAL);
    });

    it('creates an ORGANIZER task after verifying organizer role', async () => {
      mockInsertReturning.mockResolvedValue([mockOrganizerTask]);
      const dto: CreateTripTaskDto = { scope: TripTaskScope.ORGANIZER, title: 'Secure permits' };

      const result = await service.createTask(mockUser, 'trip-uuid', dto);

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      const insertedValues = mockInsertValues.mock.calls[0]?.[0] as { scope: TripTaskScope };
      expect(insertedValues.scope).toBe(TripTaskScope.ORGANIZER);
      expect(result.scope).toBe(TripTaskScope.ORGANIZER);
    });

    it('throws ForbiddenException when creating SHARED without organizer role', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());
      const dto: CreateTripTaskDto = { scope: TripTaskScope.SHARED, title: 'Book the group van' };

      await expect(service.createTask(mockUser, 'trip-uuid', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when creating ORGANIZER without organizer role', async () => {
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());
      const dto: CreateTripTaskDto = { scope: TripTaskScope.ORGANIZER, title: 'Secure permits' };

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
      mockTripTasksFindFirst.mockResolvedValue({
        ...mockPersonalTask,
        createdBy: 'other-user-uuid',
      });

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'personal-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates an ORGANIZER task after verifying organizer role', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockOrganizerTask);
      mockUpdateReturning.mockResolvedValue([mockOrganizerTask]);

      const result = await service.updateTaskTitle(
        mockUser,
        'trip-uuid',
        'organizer-task-uuid',
        dto,
      );

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(result.id).toBe('organizer-task-uuid');
    });

    it('resolves completedByUsername when renaming an already-completed ORGANIZER task', async () => {
      const completedTask = {
        ...mockOrganizerTask,
        completedAt: new Date(),
        completedBy: 'organizer-uuid',
      };
      mockTripTasksFindFirst.mockResolvedValue(completedTask);
      mockUpdateReturning.mockResolvedValue([completedTask]);
      mockUsersFindFirst.mockResolvedValue({ username: 'ana_organizer' });

      const result = await service.updateTaskTitle(
        mockUser,
        'trip-uuid',
        'organizer-task-uuid',
        dto,
      );

      expect(mockUsersFindFirst).toHaveBeenCalled();
      expect(result.completedByUsername).toBe('ana_organizer');
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

    it('throws NotFoundException when trip does not exist, before loading the task', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not an active participant, before loading the task', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateTaskTitle(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
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

    it('PERSONAL task: owner sets completedAt without recording completedBy', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockPersonalTask);
      mockUpdateReturning.mockResolvedValue([{ ...mockPersonalTask, completedAt: new Date() }]);
      const dto: SetTripTaskCompletionDto = { completed: true };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'personal-task-uuid', dto);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ completedBy: null }));
      expect(result.completed).toBe(true);
      expect(result.completedByUsername).toBeNull();
    });

    it('PERSONAL task: throws ForbiddenException for a non-owner', async () => {
      mockTripTasksFindFirst.mockResolvedValue({
        ...mockPersonalTask,
        createdBy: 'other-user-uuid',
      });
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'personal-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ORGANIZER task: organizer sets a single shared completedAt and records completedBy', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockOrganizerTask);
      mockUpdateReturning.mockResolvedValue([
        { ...mockOrganizerTask, completedAt: new Date(), completedBy: mockUser.id },
      ]);
      const dto: SetTripTaskCompletionDto = { completed: true };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'organizer-task-uuid', dto);

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ completedBy: mockUser.id }),
      );
      expect(result.completed).toBe(true);
      expect(result.completedByUsername).toBe(mockUser.username);
    });

    it('ORGANIZER task: uncompleting clears completedBy regardless of who completed it', async () => {
      mockTripTasksFindFirst.mockResolvedValue({
        ...mockOrganizerTask,
        completedAt: new Date(),
        completedBy: 'other-organizer-uuid',
      });
      mockUpdateReturning.mockResolvedValue([mockOrganizerTask]);
      const dto: SetTripTaskCompletionDto = { completed: false };

      const result = await service.setCompletion(mockUser, 'trip-uuid', 'organizer-task-uuid', dto);

      expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ completedBy: null }));
      expect(result.completed).toBe(false);
      expect(result.completedByUsername).toBeNull();
    });

    it('ORGANIZER task: throws ForbiddenException for a non-organizer', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockOrganizerTask);
      mockAssertOrganizerRole.mockRejectedValue(new ForbiddenException());
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'organizer-task-uuid', dto),
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

    it('throws NotFoundException when trip does not exist, before loading the task', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not an active participant, before loading the task', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);
      const dto: SetTripTaskCompletionDto = { completed: true };

      await expect(
        service.setCompletion(mockUser, 'trip-uuid', 'shared-task-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
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
      mockTripTasksFindFirst.mockResolvedValue({
        ...mockPersonalTask,
        createdBy: 'other-user-uuid',
      });

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'personal-task-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes an ORGANIZER task after verifying organizer role', async () => {
      mockTripTasksFindFirst.mockResolvedValue(mockOrganizerTask);

      await expect(
        service.deleteTask(mockUser, 'trip-uuid', 'organizer-task-uuid'),
      ).resolves.toBeUndefined();

      expect(mockAssertOrganizerRole).toHaveBeenCalledWith('trip-uuid', mockUser.id, true);
      expect(mockDeleteWhere).toHaveBeenCalled();
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

    it('throws NotFoundException when trip does not exist, before loading the task', async () => {
      mockTripsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'shared-task-uuid')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not an active participant, before loading the task', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteTask(mockUser, 'trip-uuid', 'shared-task-uuid')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockTripTasksFindFirst).not.toHaveBeenCalled();
    });
  });
});
