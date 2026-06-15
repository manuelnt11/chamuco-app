import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, count, eq, gt, inArray, max, sql } from 'drizzle-orm';

import { TripStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripDestinations } from '@/modules/trips/schema/trip-destinations.schema';
import { TripsService } from '@/modules/trips/trips.service';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';

@Injectable()
export class TripsDestinationsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
  ) {}

  async listDestinations(tripId: string): Promise<DestinationResponseDto[]> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');

    const rows = await this.db
      .select()
      .from(tripDestinations)
      .where(eq(tripDestinations.tripId, tripId))
      .orderBy(asc(tripDestinations.position));

    return rows.map((d) => this.mapDestination(d));
  }

  async addDestination(
    user: AuthenticatedUser,
    tripId: string,
    dto: CreateDestinationDto,
  ): Promise<DestinationWriteResponseDto> {
    const { trip, requiresConfirmation } = await this.assertDestinationWrite(tripId, user.id);

    const [maxRow] = await this.db
      .select({ maxPos: max(tripDestinations.position) })
      .from(tripDestinations)
      .where(eq(tripDestinations.tripId, trip.id));

    const nextPosition = (maxRow?.maxPos ?? 0) + 1;

    const [dest] = await this.db
      .insert(tripDestinations)
      .values({
        tripId: trip.id,
        position: nextPosition,
        countryCode: dto.countryCode,
        city: dto.city,
        label: dto.label ?? null,
      })
      .returning();

    if (!dest) throw new Error('Failed to insert destination');

    return { ...this.mapDestination(dest), requiresConfirmation };
  }

  async updateDestination(
    user: AuthenticatedUser,
    tripId: string,
    destId: string,
    dto: UpdateDestinationDto,
  ): Promise<DestinationWriteResponseDto> {
    const { requiresConfirmation } = await this.assertDestinationWrite(tripId, user.id);

    const dest = await this.db.query.tripDestinations.findFirst({
      where: and(eq(tripDestinations.id, destId), eq(tripDestinations.tripId, tripId)),
    });
    if (!dest) throw new NotFoundException('Destination not found');

    const patch: Partial<typeof tripDestinations.$inferInsert> = {};
    if (dto.countryCode !== undefined) patch.countryCode = dto.countryCode;
    if (dto.city !== undefined) patch.city = dto.city;
    if (dto.label !== undefined) patch.label = dto.label;

    const [updated] =
      Object.keys(patch).length > 0
        ? await this.db
            .update(tripDestinations)
            .set(patch)
            .where(eq(tripDestinations.id, destId))
            .returning()
        : [dest];

    if (!updated) throw new Error('Failed to update destination');

    return { ...this.mapDestination(updated), requiresConfirmation };
  }

  async deleteDestination(user: AuthenticatedUser, tripId: string, destId: string): Promise<void> {
    await this.assertDestinationWrite(tripId, user.id);

    const dest = await this.db.query.tripDestinations.findFirst({
      where: and(eq(tripDestinations.id, destId), eq(tripDestinations.tripId, tripId)),
    });
    if (!dest) throw new NotFoundException('Destination not found');

    const [countRow] = await this.db
      .select({ total: count() })
      .from(tripDestinations)
      .where(eq(tripDestinations.tripId, tripId));

    if ((countRow?.total ?? 0) <= 1) {
      throw new UnprocessableEntityException(
        'Cannot delete the last destination — trips must have at least one destination',
      );
    }

    await this.db.delete(tripDestinations).where(eq(tripDestinations.id, destId));

    await this.db
      .update(tripDestinations)
      .set({ position: sql`${tripDestinations.position} - 1` })
      .where(
        and(eq(tripDestinations.tripId, tripId), gt(tripDestinations.position, dest.position)),
      );
  }

  async reorderDestinations(
    user: AuthenticatedUser,
    tripId: string,
    dto: ReorderDestinationsDto,
  ): Promise<DestinationResponseDto[]> {
    await this.assertDestinationWrite(tripId, user.id);

    const existing = await this.db
      .select({ id: tripDestinations.id })
      .from(tripDestinations)
      .where(eq(tripDestinations.tripId, tripId));

    const existingIds = new Set(existing.map((d) => d.id));

    if (
      dto.destinationIds.length !== existingIds.size ||
      !dto.destinationIds.every((id) => existingIds.has(id))
    ) {
      throw new BadRequestException(
        'destinationIds must contain exactly all destination IDs for this trip',
      );
    }

    // PostgreSQL checks non-deferred UNIQUE constraints per-row even within a
    // single UPDATE statement, so a direct CASE-based reorder still causes
    // transient duplicate-key violations when positions are swapped.
    // Two-step approach inside a transaction:
    //   1. Shift all positions to a safe temp range (current + large offset).
    //   2. Set final positions 1..N — no conflict because step 1 cleared the way.
    const offset = dto.destinationIds.length + 1;
    const caseExpr = sql<number>`(CASE ${sql.join(
      dto.destinationIds.map((id, i) => sql`WHEN ${tripDestinations.id} = ${id} THEN ${i + 1}`),
      sql` `,
    )} END)::int`;

    await this.db.transaction(async (trx) => {
      await trx
        .update(tripDestinations)
        .set({ position: sql`${tripDestinations.position} + ${offset}` })
        .where(eq(tripDestinations.tripId, tripId));

      await trx
        .update(tripDestinations)
        .set({ position: caseExpr })
        .where(
          and(
            eq(tripDestinations.tripId, tripId),
            inArray(tripDestinations.id, dto.destinationIds),
          ),
        );
    });

    return this.listDestinations(tripId);
  }

  private async assertDestinationWrite(
    tripId: string,
    userId: string,
  ): Promise<{ trip: typeof trips.$inferSelect; requiresConfirmation: boolean }> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new ForbiddenException('Trip destinations cannot be modified in its current status');
    }

    await this.tripsService.assertOrganizerRole(tripId, userId, true);

    const requiresConfirmation =
      trip.status === TripStatus.CONFIRMED || trip.status === TripStatus.IN_PROGRESS;
    return { trip, requiresConfirmation };
  }

  private mapDestination(dest: typeof tripDestinations.$inferSelect): DestinationResponseDto {
    return {
      id: dest.id,
      tripId: dest.tripId,
      position: dest.position,
      countryCode: dest.countryCode,
      city: dest.city,
      label: dest.label,
      createdAt: dest.createdAt.toISOString(),
    };
  }
}
