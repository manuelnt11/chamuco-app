import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupTrips } from '@/modules/trips/schema/group-trips.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { TripsService } from '@/modules/trips/trips.service';
import type { TripGroupResponseDto } from './dto/trip-group-response.dto';
import type { TripLinkedGroupDto } from './dto/trip-linked-group.dto';
import type { AddTripGroupDto } from './dto/add-trip-group.dto';

@Injectable()
export class TripsGroupsService {
  private readonly logger = new Logger(TripsGroupsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
    private readonly assetResolver: AssetResolverService,
  ) {}

  async listLinkedGroups(tripId: string): Promise<TripLinkedGroupDto[]> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');

    const links = await this.db.select().from(groupTrips).where(eq(groupTrips.tripId, tripId));

    if (links.length === 0) return [];

    const groupIds = links.map((l) => l.groupId);
    const groupRows = await this.db.query.groups.findMany({
      where: and(inArray(groups.id, groupIds), isNull(groups.deletedAt)),
    });

    if (groupRows.length === 0) return [];

    const coverIds = groupRows.map((g) => g.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));

    return Promise.all(
      groupRows.map(async (group) => {
        if (!group.cover) return { id: group.id, name: group.name, coverUrl: null };
        const coverRow = assetMap.get(group.cover);
        if (!coverRow) {
          this.logger.warn(`Orphaned cover asset ${group.cover} on group ${group.id}`);
          return { id: group.id, name: group.name, coverUrl: null };
        }
        const resolved = await this.assetResolver.resolve(assetRowToAsset(coverRow));
        if (!resolved) {
          this.logger.warn(`Failed to resolve cover asset ${group.cover} on group ${group.id}`);
          return { id: group.id, name: group.name, coverUrl: null };
        }
        return { id: group.id, name: group.name, coverUrl: resolved.url };
      }),
    );
  }

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
