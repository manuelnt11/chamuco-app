import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray } from 'drizzle-orm';
import {
  MembershipStatus,
  TripParticipantStatus,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { tripDestinations } from '@/modules/trips/schema/trip-destinations.schema';
import type { SearchTripsQueryDto } from './dto/search-trips-query.dto';
import type { TripSearchResponseDto } from './dto/trip-search-result.dto';

const ACTIVE_STATUSES: TripParticipantStatus[] = [
  TripParticipantStatus.ACCEPTED,
  TripParticipantStatus.CONFIRMED,
];

const PENDING_STATUSES: TripParticipantStatus[] = [
  TripParticipantStatus.PENDING_REQUEST,
  TripParticipantStatus.INVITED,
];

@Injectable()
export class TripDiscoveryService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async searchTrips(userId: string, query: SearchTripsQueryDto): Promise<TripSearchResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const conditions = and(
      eq(trips.visibility, TripVisibility.PUBLIC),
      eq(trips.status, TripStatus.OPEN),
      ...(query.q ? [ilike(trips.name, `%${query.q}%`)] : []),
    );

    // Count total matching trips
    const countResult = await this.db.select({ total: count() }).from(trips).where(conditions);
    const total = countResult[0]?.total ?? 0;

    if (total === 0) return { data: [], total: 0 };

    // Fetch the requested page
    const tripRows = await this.db.query.trips.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: (t) => [asc(t.startDate), asc(t.name)],
    });

    if (tripRows.length === 0) return { data: [], total };

    const tripIds = tripRows.map((t) => t.id);

    // Batch-load confirmed participant counts (ACCEPTED + CONFIRMED)
    const confirmedRows = await this.db.query.tripParticipants.findMany({
      where: and(
        inArray(tripParticipants.tripId, tripIds),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
      columns: { tripId: true },
    });
    const confirmedCountMap = new Map<string, number>();
    for (const row of confirmedRows) {
      confirmedCountMap.set(row.tripId, (confirmedCountMap.get(row.tripId) ?? 0) + 1);
    }

    // Get the caller's participation status for each trip in the page
    const userParticipations = await this.db.query.tripParticipants.findMany({
      where: and(inArray(tripParticipants.tripId, tripIds), eq(tripParticipants.userId, userId)),
      columns: { tripId: true, status: true },
    });
    const participationStatusMap = new Map(userParticipations.map((p) => [p.tripId, p.status]));

    // Batch-load destinations (ordered by position)
    const destinationRows = await this.db.query.tripDestinations.findMany({
      where: inArray(tripDestinations.tripId, tripIds),
      orderBy: [asc(tripDestinations.tripId), asc(tripDestinations.position)],
      columns: { tripId: true, city: true, countryCode: true, position: true },
    });
    const destinationsMap = new Map<string, { city: string; countryCode: string }[]>();
    for (const row of destinationRows) {
      const list = destinationsMap.get(row.tripId) ?? [];
      list.push({ city: row.city, countryCode: row.countryCode });
      destinationsMap.set(row.tripId, list);
    }

    const data = tripRows.map((trip) => {
      const rawStatus = participationStatusMap.get(trip.id);
      let participationStatus: MembershipStatus;
      if (!rawStatus || rawStatus === TripParticipantStatus.DECLINED) {
        participationStatus = 'none';
      } else if (PENDING_STATUSES.includes(rawStatus)) {
        participationStatus = 'pending';
      } else {
        participationStatus = 'active';
      }

      return {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        participantCapacity: trip.participantCapacity,
        confirmedParticipantCount: confirmedCountMap.get(trip.id) ?? 0,
        destinations: destinationsMap.get(trip.id) ?? [],
        participationStatus,
      };
    });

    return { data, total };
  }
}
