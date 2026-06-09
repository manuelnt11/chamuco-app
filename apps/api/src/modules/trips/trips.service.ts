import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import { PlatformRole, TripParticipantStatus, TripRole, TripStatus } from '@chamuco/shared-types';
import { tripAnnouncements } from '@/modules/trip-announcements/schema/trip-announcements.schema';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import type { AuthenticatedUser } from '@/types/express';
import { trips } from './schema/trips.schema';
import { tripDestinations } from './schema/trip-destinations.schema';
import { tripParticipants } from './schema/trip-participants.schema';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TripResponseDto } from './dto/trip-response.dto';
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
