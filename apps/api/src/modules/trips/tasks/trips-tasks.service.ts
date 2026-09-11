import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, or } from 'drizzle-orm';

import { TripStatus, TripTaskScope } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { tripTaskCompletions, tripTasks } from '@/modules/trips/schema/trip-tasks.schema';
import { users } from '@/modules/users/schema/users.schema';
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
    const isOrganizer = await this.tripsService.isOrganizerRole(tripId, user.id, true);

    const visibleScopes = [
      eq(tripTasks.scope, TripTaskScope.SHARED),
      eq(tripTasks.createdBy, user.id),
    ];
    if (isOrganizer) visibleScopes.push(eq(tripTasks.scope, TripTaskScope.ORGANIZER));

    const tasks = await this.db.query.tripTasks.findMany({
      where: and(eq(tripTasks.tripId, tripId), or(...visibleScopes)),
      orderBy: asc(tripTasks.createdAt),
    });

    const sharedTaskIds = tasks.filter((t) => t.scope === TripTaskScope.SHARED).map((t) => t.id);
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

    const completerUsernames = await this.fetchCompleterUsernames(tasks);

    return tasks.map((t) =>
      this.mapTask(
        t,
        t.scope === TripTaskScope.SHARED ? completedSharedIds.has(t.id) : t.completedAt !== null,
        t.completedBy ? (completerUsernames.get(t.completedBy) ?? null) : null,
      ),
    );
  }

  async createTask(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);

    if (dto.scope === TripTaskScope.SHARED || dto.scope === TripTaskScope.ORGANIZER) {
      await this.tripsService.assertOrganizerRole(tripId, user.id, true);
    }

    const [task] = await this.db
      .insert(tripTasks)
      .values({
        tripId,
        scope: dto.scope,
        title: dto.title,
        createdBy: user.id,
      })
      .returning();

    if (!task) throw new Error('Failed to insert trip task');

    return this.mapTask(task, false, null);
  }

  async updateTaskTitle(
    user: AuthenticatedUser,
    tripId: string,
    taskId: string,
    dto: UpdateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);
    const task = await this.findTaskOrThrow(tripId, taskId);
    await this.assertCanManageTask(tripId, user.id, task);

    const [updated] = await this.db
      .update(tripTasks)
      .set({ title: dto.title })
      .where(eq(tripTasks.id, taskId))
      .returning();

    if (!updated) throw new Error('Failed to update trip task');

    const completed =
      updated.scope === TripTaskScope.SHARED
        ? await this.hasSharedCompletion(taskId, user.id)
        : updated.completedAt !== null;
    const completedByUsername = await this.resolveCompleterUsername(updated.completedBy);

    return this.mapTask(updated, completed, completedByUsername);
  }

  async setCompletion(
    user: AuthenticatedUser,
    tripId: string,
    taskId: string,
    dto: SetTripTaskCompletionDto,
  ): Promise<TripTaskResponseDto> {
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);
    const task = await this.findTaskOrThrow(tripId, taskId);

    if (task.scope === TripTaskScope.PERSONAL) {
      if (task.createdBy !== user.id) {
        throw new ForbiddenException('Only the owner can complete a personal task');
      }

      return this.setSingleCompletion(task, dto.completed, null, null);
    }

    if (task.scope === TripTaskScope.ORGANIZER) {
      await this.tripsService.assertOrganizerRole(tripId, user.id, true);
      const completedBy = dto.completed ? user.id : null;
      const completedByUsername = dto.completed ? user.username : null;
      return this.setSingleCompletion(task, dto.completed, completedBy, completedByUsername);
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

    return this.mapTask(task, dto.completed, null);
  }

  async deleteTask(user: AuthenticatedUser, tripId: string, taskId: string): Promise<void> {
    const trip = await this.assertActiveParticipant(tripId, user.id);
    this.assertTripMutable(trip);
    const task = await this.findTaskOrThrow(tripId, taskId);
    await this.assertCanManageTask(tripId, user.id, task);

    await this.db.delete(tripTasks).where(eq(tripTasks.id, taskId));
  }

  private async setSingleCompletion(
    task: TripTask,
    completed: boolean,
    completedBy: string | null,
    completedByUsername: string | null,
  ): Promise<TripTaskResponseDto> {
    const [updated] = await this.db
      .update(tripTasks)
      .set({ completedAt: completed ? new Date() : null, completedBy })
      .where(eq(tripTasks.id, task.id))
      .returning();

    if (!updated) throw new Error('Failed to update trip task');
    return this.mapTask(updated, completed, completedByUsername);
  }

  private async findTaskOrThrow(tripId: string, taskId: string): Promise<TripTask> {
    const task = await this.db.query.tripTasks.findFirst({
      where: and(eq(tripTasks.id, taskId), eq(tripTasks.tripId, tripId)),
    });
    if (!task) throw new NotFoundException('Trip task not found');
    return task;
  }

  private async assertCanManageTask(tripId: string, userId: string, task: TripTask): Promise<void> {
    if (task.scope === TripTaskScope.PERSONAL) {
      if (task.createdBy !== userId) {
        throw new ForbiddenException('Only the owner can manage a personal task');
      }
      return;
    }

    await this.tripsService.assertOrganizerRole(tripId, userId, true);
  }

  private async hasSharedCompletion(taskId: string, userId: string): Promise<boolean> {
    const row = await this.db.query.tripTaskCompletions.findFirst({
      where: and(eq(tripTaskCompletions.taskId, taskId), eq(tripTaskCompletions.userId, userId)),
    });
    return !!row;
  }

  private async resolveCompleterUsername(completedBy: string | null): Promise<string | null> {
    if (!completedBy) return null;
    const completer = await this.db.query.users.findFirst({
      where: eq(users.id, completedBy),
      columns: { username: true },
    });
    return completer?.username ?? null;
  }

  private async fetchCompleterUsernames(tasks: TripTask[]): Promise<Map<string, string>> {
    const completerIds = [...new Set(tasks.map((t) => t.completedBy).filter((id) => id !== null))];
    if (completerIds.length === 0) return new Map();

    const completers = await this.db.query.users.findMany({
      where: inArray(users.id, completerIds),
      columns: { id: true, username: true },
    });
    return new Map(completers.map((c) => [c.id, c.username]));
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

  private mapTask(
    task: TripTask,
    completed: boolean,
    completedByUsername: string | null,
  ): TripTaskResponseDto {
    return {
      id: task.id,
      tripId: task.tripId,
      scope: task.scope,
      title: task.title,
      completed,
      completedByUsername,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
    };
  }
}
