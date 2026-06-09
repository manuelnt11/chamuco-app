import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, count, eq, inArray, max } from 'drizzle-orm';

import { PlatformRole, TripParticipantStatus, TripRole, TripStatus } from '@chamuco/shared-types';
import { tripAnnouncements } from '@/modules/trip-announcements/schema/trip-announcements.schema';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { groups } from '@/modules/groups/schema/groups.schema';
import { trips } from './schema/trips.schema';
import { groupTrips } from './schema/group-trips.schema';
import { tripDestinations } from './schema/trip-destinations.schema';
import { tripParticipants } from './schema/trip-participants.schema';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TripResponseDto } from './dto/trip-response.dto';
import type { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';
import type { TripGroupResponseDto } from './dto/trip-group-response.dto';
import type { AddTripGroupDto } from './dto/add-trip-group.dto';

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
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async createTrip(user: AuthenticatedUser, dto: CreateTripDto): Promise<TripResponseDto> {
    let tripId!: string;
    const now = new Date();

    await this.db.transaction(async (trx) => {
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

    return this.fetchAndMapTrip(tripId);
  }

  async getTrip(tripId: string): Promise<TripResponseDto> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    return this.mapTrip(trip);
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

    if (Object.keys(patch).length > 0) {
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

    await this.db.transaction(async (trx) => {
      for (let i = 0; i < dto.destinationIds.length; i++) {
        await trx
          .update(tripDestinations)
          .set({ position: i + 1 })
          .where(eq(tripDestinations.id, dto.destinationIds[i]!));
      }
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

    await this.assertOrganizerRole(tripId, userId, true);

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

  private async assertOrganizerRole(
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

  async listTripGroups(user: AuthenticatedUser, tripId: string): Promise<TripGroupResponseDto[]> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.assertOrganizerRole(tripId, user.id, false);

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
    await this.assertOrganizerRole(tripId, user.id, false);

    const group = await this.db.query.groups.findFirst({ where: eq(groups.id, dto.groupId) });
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
    await this.assertOrganizerRole(tripId, user.id, false);

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

  private async fetchAndMapTrip(id: string): Promise<TripResponseDto> {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, id) });
    if (!trip) throw new NotFoundException('Trip not found');
    return this.mapTrip(trip);
  }

  private mapTrip(trip: typeof trips.$inferSelect): TripResponseDto {
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
    };
  }
}
