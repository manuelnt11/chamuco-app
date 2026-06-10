import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupTrips } from '@/modules/trips/schema/group-trips.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { TripsService } from '@/modules/trips/trips.service';
import type { TripGroupResponseDto } from './dto/trip-group-response.dto';
import type { AddTripGroupDto } from './dto/add-trip-group.dto';

@Injectable()
export class TripsGroupsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
  ) {}

  async listTripGroups(user: AuthenticatedUser, tripId: string): Promise<TripGroupResponseDto[]> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.tripsService.assertOrganizerRole(tripId, user.id, false);

    const rows = await this.db.select().from(groupTrips).where(eq(groupTrips.tripId, tripId));
    return rows.map((r) => this.mapTripGroup(r));
  }

  async addTripGroup(
    user: AuthenticatedUser,
    tripId: string,
    dto: AddTripGroupDto,
  ): Promise<TripGroupResponseDto> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.tripsService.assertOrganizerRole(tripId, user.id, false);

    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, dto.groupId), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');

    await this.db.insert(groupTrips).values({ tripId, groupId: dto.groupId }).onConflictDoNothing();

    const [row] = await this.db
      .select()
      .from(groupTrips)
      .where(and(eq(groupTrips.tripId, tripId), eq(groupTrips.groupId, dto.groupId)));

    if (!row) throw new Error('Failed to retrieve group trip link');
    return this.mapTripGroup(row);
  }

  async removeTripGroup(user: AuthenticatedUser, tripId: string, groupId: string): Promise<void> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.tripsService.assertOrganizerRole(tripId, user.id, false);

    const link = await this.db.query.groupTrips.findFirst({
      where: and(eq(groupTrips.tripId, tripId), eq(groupTrips.groupId, groupId)),
    });
    if (!link) throw new NotFoundException('Group is not linked to this trip');

    await this.db
      .delete(groupTrips)
      .where(and(eq(groupTrips.tripId, tripId), eq(groupTrips.groupId, groupId)));
  }

  private mapTripGroup(row: typeof groupTrips.$inferSelect): TripGroupResponseDto {
    return {
      tripId: row.tripId,
      groupId: row.groupId,
      addedAt: row.addedAt.toISOString(),
    };
  }
}
