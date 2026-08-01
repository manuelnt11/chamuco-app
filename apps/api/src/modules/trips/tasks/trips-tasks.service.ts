import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';

import { TripStatus, TripTaskScope } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { tripTaskCompletions, tripTasks } from '@/modules/trips/schema/trip-tasks.schema';
import { ACTIVE_STATUSES } from '@/modules/trips/participants/trip-participants.constants';
import { TripsService } from '@/modules/trips/trips.service';
import type { CreateTripTaskDto } from './dto/create-trip-task.dto';
import type { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import type { SetTripTaskCompletionDto } from './dto/set-trip-task-completion.dto';
import type { TripTaskResponseDto } from './dto/trip-task-response.dto';

type Trip = typeof trips.$inferSelect;
type TripTask = typeof tripTasks.$inferSelect;

@Injectable()
export class TripsTasksService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
  ) {}

  async listTasks(user: AuthenticatedUser, tripId: string): Promise<TripTaskResponseDto[]> {
    await this.assertActiveParticipant(tripId, user.id);

    const tasks = await this.db.query.tripTasks.findMany({
      where: and(
        eq(tripTasks.tripId, tripId),
        or(isNull(tripTasks.ownerId), eq(tripTasks.ownerId, user.id)),
      ),
      orderBy: asc(tripTasks.createdAt),
    });

    const sharedTaskIds = tasks.filter((t) => t.ownerId === null).map((t) => t.id);
    let completedSharedIds = new Set<string>();
    if (sharedTaskIds.length > 0) {
      const rows = await this.db.query.tripTaskCompletions.findMany({
        where: and(
          eq(tripTaskCompletions.userId, user.id),
          inArray(tripTaskCompletions.taskId, sharedTaskIds),
        ),
      });
      completedSharedIds = new Set(rows.map((r) => r.taskId));
    }

    return tasks.map((t) =>
      this.mapTask(t, t.ownerId === null ? completedSharedIds.has(t.id) : t.completedAt !== null),
    );
  }

  async createTask(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);

    if (dto.scope === TripTaskScope.SHARED) {
      await this.tripsService.assertOrganizerRole(tripId, user.id, true);
    }

    const [task] = await this.db
      .insert(tripTasks)
      .values({
        tripId,
        ownerId: dto.scope === TripTaskScope.PERSONAL ? user.id : null,
        title: dto.title,
        createdBy: user.id,
      })
      .returning();

    if (!task) throw new Error('Failed to insert trip task');

    return this.mapTask(task, false);
  }

  async updateTaskTitle(
    user: AuthenticatedUser,
    tripId: string,
    taskId: string,
    dto: UpdateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const task = await this.findTaskOrThrow(tripId, taskId);
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);
    await this.assertCanManageTask(tripId, user.id, task);

    const [updated] = await this.db
      .update(tripTasks)
      .set({ title: dto.title })
      .where(eq(tripTasks.id, taskId))
      .returning();

    if (!updated) throw new Error('Failed to update trip task');

    const completed =
      updated.ownerId === null
        ? await this.hasSharedCompletion(taskId, user.id)
        : updated.completedAt !== null;

    return this.mapTask(updated, completed);
  }

  async setCompletion(
    user: AuthenticatedUser,
    tripId: string,
    taskId: string,
    dto: SetTripTaskCompletionDto,
  ): Promise<TripTaskResponseDto> {
    const task = await this.findTaskOrThrow(tripId, taskId);
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);

    if (task.ownerId !== null) {
      if (task.ownerId !== user.id) {
        throw new ForbiddenException('Only the owner can complete a personal task');
      }

      const [updated] = await this.db
        .update(tripTasks)
        .set({ completedAt: dto.completed ? new Date() : null })
        .where(eq(tripTasks.id, taskId))
        .returning();

      if (!updated) throw new Error('Failed to update trip task');
      return this.mapTask(updated, dto.completed);
    }

    if (dto.completed) {
      await this.db
        .insert(tripTaskCompletions)
        .values({ taskId, userId: user.id })
        .onConflictDoNothing();
    } else {
      await this.db
        .delete(tripTaskCompletions)
        .where(
          and(eq(tripTaskCompletions.taskId, taskId), eq(tripTaskCompletions.userId, user.id)),
        );
    }

    return this.mapTask(task, dto.completed);
  }

  async deleteTask(user: AuthenticatedUser, tripId: string, taskId: string): Promise<void> {
    const task = await this.findTaskOrThrow(tripId, taskId);
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);
    await this.assertCanManageTask(tripId, user.id, task);

    await this.db.delete(tripTasks).where(eq(tripTasks.id, taskId));
  }

  private async findTaskOrThrow(tripId: string, taskId: string): Promise<TripTask> {
    const task = await this.db.query.tripTasks.findFirst({
      where: and(eq(tripTasks.id, taskId), eq(tripTasks.tripId, tripId)),
    });
    if (!task) throw new NotFoundException('Trip task not found');
    return task;
  }

  private async assertCanManageTask(tripId: string, userId: string, task: TripTask): Promise<void> {
    if (task.ownerId === null) {
      await this.tripsService.assertOrganizerRole(tripId, userId, true);
      return;
    }

    if (task.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can manage a personal task');
    }
  }

  private async hasSharedCompletion(taskId: string, userId: string): Promise<boolean> {
    const row = await this.db.query.tripTaskCompletions.findFirst({
      where: and(eq(tripTaskCompletions.taskId, taskId), eq(tripTaskCompletions.userId, userId)),
    });
    return !!row;
  }

  private async assertActiveParticipant(tripId: string, userId: string): Promise<Trip> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');

    const participant = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
    });

    if (!participant) {
      throw new ForbiddenException('Only active trip participants can access trip tasks');
    }

    return trip;
  }

  private assertTripMutable(trip: Trip): void {
    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new ForbiddenException('Trip tasks cannot be modified in its current status');
    }
  }

  private mapTask(task: TripTask, completed: boolean): TripTaskResponseDto {
    return {
      id: task.id,
      tripId: task.tripId,
      scope: task.ownerId === null ? TripTaskScope.SHARED : TripTaskScope.PERSONAL,
      title: task.title,
      completed,
      ownerId: task.ownerId,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
    };
  }
}
