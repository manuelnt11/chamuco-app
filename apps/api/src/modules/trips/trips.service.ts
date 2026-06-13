import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import {
  PlatformRole,
  TripParticipantStatus,
  TripRole,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';
import { tripAnnouncements } from '@/modules/trips/schema/trip-announcements.schema';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { PUBLIC_OBJECT_PREFIXES } from '@/modules/cloud-storage/cloud-storage.constants';
import type { AuthenticatedUser } from '@/types/express';
import { trips } from './schema/trips.schema';
import { tripDestinations } from './schema/trip-destinations.schema';
import { tripParticipants } from './schema/trip-participants.schema';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TripResponseDto } from './dto/trip-response.dto';
import type { MyTripListItemResponseDto } from './dto/my-trip-list-item-response.dto';
import type { TransitionTripStatusDto } from './dto/transition-trip-status.dto';

// TODO: migrate to system settings module when admin config is available
const FEEDBACK_WINDOW_DAYS = parseInt(process.env['TRIP_FEEDBACK_WINDOW_DAYS'] ?? '7', 10) || 7;

const VALID_TRANSITIONS: Partial<Record<TripStatus, TripStatus[]>> = {
  [TripStatus.DRAFT]: [TripStatus.OPEN, TripStatus.CANCELLED],
  [TripStatus.OPEN]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
  [TripStatus.CONFIRMED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
};

@Injectable()
export class TripsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly cloudStorage: CloudStorageService,
  ) {}

  async getMyTrips(user: AuthenticatedUser): Promise<MyTripListItemResponseDto[]> {
    const memberships = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.userId, user.id),
        inArray(tripParticipants.status, [
          TripParticipantStatus.ACCEPTED,
          TripParticipantStatus.CONFIRMED,
        ]),
      ),
    });

    if (memberships.length === 0) return [];

    const tripIds = memberships.map((m) => m.tripId);
    const roleByTripId = new Map(memberships.map((m) => [m.tripId, m.role]));

    const tripRows = await this.db.query.trips.findMany({
      where: inArray(trips.id, tripIds),
    });

    if (tripRows.length === 0) return [];

    const coverIds = tripRows.map((t) => t.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));

    const countRows = await this.db
      .select({ tripId: tripParticipants.tripId, total: count() })
      .from(tripParticipants)
      .where(
        and(
          inArray(tripParticipants.tripId, tripIds),
          eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        ),
      )
      .groupBy(tripParticipants.tripId);
    const confirmedCountByTripId = new Map(countRows.map((r) => [r.tripId, r.total]));

    return Promise.all(
      tripRows.map(async (trip) => {
        let coverUrl: string | null = null;
        if (trip.cover) {
          const coverRow = assetMap.get(trip.cover);
          if (coverRow) {
            const resolved = await this.assetResolver.resolve(assetRowToAsset(coverRow));
            coverUrl = resolved?.url ?? null;
          }
        }

        const base = this.mapTrip(trip);
        return {
          ...base,
          coverUrl,
          confirmedParticipantCount: confirmedCountByTripId.get(trip.id) ?? 0,
          userRole: roleByTripId.get(trip.id)!,
        };
      }),
    );
  }

  async createTrip(user: AuthenticatedUser, dto: CreateTripDto): Promise<TripResponseDto> {
    let tripId!: string;
    const now = new Date();

    await this.db.transaction(async (trx) => {
      const [coverAsset] = await trx
        .insert(assets)
        .values({
          type: 'image',
          source: dto.cover.source,
          target: dto.cover.target,
          fileSize: dto.cover.fileSize ?? null,
          isPublic: true,
        })
        .returning();

      if (!coverAsset) throw new Error('Failed to create cover asset');

      const [trip] = await trx
        .insert(trips)
        .values({
          name: dto.name,
          description: dto.description ?? null,
          visibility: dto.visibility,
          startDate: dto.startDate,
          endDate: dto.endDate,
          participantCapacity: dto.participantCapacity,
          departureCountry: dto.departureCountry,
          departureCity: dto.departureCity,
          landingCountry: dto.landingCountry,
          landingCity: dto.landingCity,
          defaultTimezone: dto.defaultTimezone ?? null,
          defaultCurrency: dto.defaultCurrency ?? null,
          itineraryNotes: dto.itineraryNotes ?? null,
          cover: coverAsset.id,
          createdBy: user.id,
        })
        .returning();

      if (!trip) throw new Error('Failed to create trip');

      await trx.insert(tripParticipants).values({
        tripId: trip.id,
        userId: user.id,
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
        isTraveler: dto.isTravelingParticipant,
        initiatedBy: user.id,
        decidedBy: user.id,
        confirmedAt: now,
      });

      tripId = trip.id;
    });

    if (dto.cover.source === 'gcs') {
      const prefix = dto.cover.target.split('/')[0];
      if (prefix && PUBLIC_OBJECT_PREFIXES.has(prefix)) {
        await this.cloudStorage.makePublic(dto.cover.target);
      }
    }

    return this.fetchAndMapTrip(tripId);
  }

  async getTrip(tripId: string): Promise<TripResponseDto> {
    return this.fetchAndMapTrip(tripId);
  }

  async updateTrip(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, id) });
    if (!trip) throw new NotFoundException('Trip not found');

    await this.assertOrganizerRole(id, user.id, true);

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException('Trip is immutable in its current status');
    }

    const effectiveStartDate = dto.startDate ?? trip.startDate;
    const effectiveEndDate = dto.endDate ?? trip.endDate;
    if (effectiveEndDate < effectiveStartDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    if (
      dto.participantCapacity !== undefined &&
      dto.participantCapacity < trip.participantCapacity
    ) {
      const [row] = await this.db
        .select({ total: count() })
        .from(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, id),
            eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
            eq(tripParticipants.isTraveler, true),
          ),
        );
      if (dto.participantCapacity < (row?.total ?? 0)) {
        throw new BadRequestException(
          'participantCapacity cannot be reduced below the current confirmed traveler count',
        );
      }
    }

    if (dto.visibility === TripVisibility.PUBLIC && trip.visibility === TripVisibility.PRIVATE) {
      throw new BadRequestException({
        error: 'TRIP_CANNOT_BE_MADE_PUBLIC',
        message: 'A private trip cannot be made public.',
      });
    }

    const patch: Partial<typeof trips.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.visibility !== undefined) patch.visibility = dto.visibility;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate;
    if (dto.participantCapacity !== undefined) patch.participantCapacity = dto.participantCapacity;
    if (dto.departureCountry !== undefined) patch.departureCountry = dto.departureCountry;
    if (dto.departureCity !== undefined) patch.departureCity = dto.departureCity;
    if (dto.landingCountry !== undefined) patch.landingCountry = dto.landingCountry;
    if (dto.landingCity !== undefined) patch.landingCity = dto.landingCity;
    if (dto.defaultTimezone !== undefined) patch.defaultTimezone = dto.defaultTimezone;
    if (dto.defaultCurrency !== undefined) patch.defaultCurrency = dto.defaultCurrency;
    if (dto.itineraryNotes !== undefined) patch.itineraryNotes = dto.itineraryNotes;

    if (dto.cover) {
      const cover = dto.cover;
      let oldAsset: typeof assets.$inferSelect | undefined;

      await this.db.transaction(async (trx) => {
        oldAsset = trip.cover
          ? await trx.query.assets.findFirst({ where: eq(assets.id, trip.cover) })
          : undefined;

        const [newAsset] = await trx
          .insert(assets)
          .values({
            type: 'image',
            source: cover.source,
            target: cover.target,
            fileSize: cover.fileSize ?? null,
            isPublic: true,
          })
          .returning();

        if (!newAsset) throw new Error('Failed to create cover asset');

        await trx
          .update(trips)
          .set({ ...patch, cover: newAsset.id })
          .where(eq(trips.id, id));
      });

      if (cover.source === 'gcs') {
        const prefix = cover.target.split('/')[0];
        if (prefix && PUBLIC_OBJECT_PREFIXES.has(prefix)) {
          await this.cloudStorage.makePublic(cover.target);
        }
      }

      if (oldAsset) {
        if (oldAsset.source === 'gcs') {
          await this.cloudStorage.deleteObject(oldAsset.target).catch((e: unknown) => {
            console.error('[TripsService] GCS delete failed (orphan caught by audit):', e);
          });
        }
        await this.db.delete(assets).where(eq(assets.id, oldAsset.id));
      }
    } else if (Object.keys(patch).length > 0) {
      await this.db.update(trips).set(patch).where(eq(trips.id, id));
    }

    return this.fetchAndMapTrip(id);
  }

  async deleteTrip(user: AuthenticatedUser, id: string): Promise<void> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, id) });
    if (!trip) throw new NotFoundException('Trip not found');

    if (user.platformRole === PlatformRole.SUPPORT_ADMIN) {
      // SUPPORT_ADMIN: allowed regardless of status
    } else {
      await this.assertOrganizerRole(id, user.id, false);
      if (trip.status !== TripStatus.DRAFT) {
        throw new ForbiddenException(
          'Only SUPPORT_ADMIN can delete a trip that is not in DRAFT status',
        );
      }
    }

    await this.db.transaction(async (trx) => {
      await trx.delete(tripAnnouncements).where(eq(tripAnnouncements.tripId, id));
      await trx.delete(trips).where(eq(trips.id, id));
    });
  }

  async transitionStatus(
    user: AuthenticatedUser,
    id: string,
    dto: TransitionTripStatusDto,
  ): Promise<TripResponseDto> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, id) });
    if (!trip) throw new NotFoundException('Trip not found');

    await this.assertOrganizerRole(id, user.id, false);

    const allowed = VALID_TRANSITIONS[trip.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition trip from ${trip.status} to ${dto.status}`);
    }

    if (trip.status === TripStatus.DRAFT && dto.status === TripStatus.OPEN) {
      const [row] = await this.db
        .select({ total: count() })
        .from(tripDestinations)
        .where(eq(tripDestinations.tripId, id));
      if ((row?.total ?? 0) < 1) {
        throw new BadRequestException(
          'Trip must have at least one destination before transitioning to OPEN',
        );
      }
    }

    await this.db.update(trips).set({ status: dto.status }).where(eq(trips.id, id));

    return this.fetchAndMapTrip(id);
  }

  async assertOrganizerRole(
    tripId: string,
    userId: string,
    allowCoOrganizer: boolean,
  ): Promise<void> {
    const roles = allowCoOrganizer
      ? [TripRole.ORGANIZER, TripRole.CO_ORGANIZER]
      : [TripRole.ORGANIZER];

    const participant = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        inArray(tripParticipants.role, roles),
      ),
    });

    if (!participant) {
      throw new ForbiddenException('Only trip organizers can perform this action');
    }
  }

  private async fetchAndMapTrip(id: string): Promise<TripResponseDto> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, id),
      with: { coverAsset: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    let coverUrl: string | null = null;
    if (trip.coverAsset) {
      const resolved = await this.assetResolver.resolve(assetRowToAsset(trip.coverAsset));
      coverUrl = resolved?.url ?? null;
    }

    return this.mapTrip(trip, coverUrl);
  }

  private mapTrip(
    trip: typeof trips.$inferSelect,
    coverUrl: string | null = null,
  ): TripResponseDto {
    const requiresConfirmation =
      trip.status === TripStatus.CONFIRMED || trip.status === TripStatus.IN_PROGRESS;

    let feedbackOpenUntil: string | null = null;
    if (trip.status === TripStatus.COMPLETED) {
      const end = new Date(trip.endDate);
      end.setUTCDate(end.getUTCDate() + FEEDBACK_WINDOW_DAYS);
      feedbackOpenUntil = end.toISOString();
    }

    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      status: trip.status,
      visibility: trip.visibility,
      startDate: trip.startDate,
      endDate: trip.endDate,
      participantCapacity: trip.participantCapacity,
      departureCountry: trip.departureCountry,
      departureCity: trip.departureCity,
      landingCountry: trip.landingCountry,
      landingCity: trip.landingCity,
      defaultTimezone: trip.defaultTimezone,
      defaultCurrency: trip.defaultCurrency,
      itineraryNotes: trip.itineraryNotes,
      agencyId: trip.agencyId,
      createdBy: trip.createdBy,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
      requiresConfirmation,
      feedbackOpenUntil,
      coverUrl,
    };
  }
}
