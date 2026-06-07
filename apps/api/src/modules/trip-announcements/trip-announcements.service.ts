import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, inArray } from 'drizzle-orm';

import {
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { tripAnnouncements } from './schema/trip-announcements.schema';
import type { CreateTripAnnouncementDto } from './dto/create-trip-announcement.dto';
import type { UpdateTripAnnouncementDto } from './dto/update-trip-announcement.dto';
import type { TripAnnouncementResponseDto } from './dto/trip-announcement-response.dto';
import type { ListTripAnnouncementsQueryDto } from './dto/list-trip-announcements-query.dto';

const ORGANIZER_ROLES = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER] as const;
const READER_STATUSES = [TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED] as const;

@Injectable()
export class TripAnnouncementsService {
  private readonly logger = new Logger(TripAnnouncementsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    tripId: string,
    callerId: string,
    callerUsername: string,
    dto: CreateTripAnnouncementDto,
  ): Promise<TripAnnouncementResponseDto> {
    await this.assertTripOrganizer(tripId, callerId);

    const [inserted] = await this.db
      .insert(tripAnnouncements)
      .values({ tripId, createdBy: callerId, content: dto.content })
      .returning();

    if (!inserted) throw new Error('Failed to create announcement');

    const [participantRows, trip] = await Promise.all([
      this.db
        .select({ userId: tripParticipants.userId })
        .from(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, tripId),
            inArray(tripParticipants.status, [...READER_STATUSES]),
          ),
        ),
      this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        columns: { name: true },
      }),
    ]);

    const userIds = participantRows.map((r) => r.userId).filter((id) => id !== callerId);

    this.notifications
      .notifyMany(
        userIds,
        NotificationType.TRIP_ANNOUNCEMENT,
        {
          tripId,
          tripName: trip?.name ?? '',
          senderUsername: callerUsername,
          announcementId: inserted.id,
        },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) =>
        this.logger.error('Failed to send trip announcement notifications', err),
      );

    return this.toDto(inserted, callerUsername);
  }

  async findOne(
    tripId: string,
    announcementId: string,
    callerId: string,
  ): Promise<TripAnnouncementResponseDto> {
    await this.assertTripParticipant(tripId, callerId);

    const row = await this.db
      .select({
        id: tripAnnouncements.id,
        tripId: tripAnnouncements.tripId,
        content: tripAnnouncements.content,
        createdAt: tripAnnouncements.createdAt,
        updatedAt: tripAnnouncements.updatedAt,
        createdByUsername: users.username,
      })
      .from(tripAnnouncements)
      .innerJoin(users, eq(tripAnnouncements.createdBy, users.id))
      .where(and(eq(tripAnnouncements.id, announcementId), eq(tripAnnouncements.tripId, tripId)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) throw new NotFoundException('Announcement not found');

    return this.toDto(row, row.createdByUsername);
  }

  async findAll(
    tripId: string,
    callerId: string,
    query: ListTripAnnouncementsQueryDto,
  ): Promise<{ items: TripAnnouncementResponseDto[]; total: number }> {
    await this.assertTripParticipant(tripId, callerId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id: tripAnnouncements.id,
          tripId: tripAnnouncements.tripId,
          content: tripAnnouncements.content,
          createdAt: tripAnnouncements.createdAt,
          updatedAt: tripAnnouncements.updatedAt,
          createdByUsername: users.username,
        })
        .from(tripAnnouncements)
        .innerJoin(users, eq(tripAnnouncements.createdBy, users.id))
        .where(eq(tripAnnouncements.tripId, tripId))
        .orderBy(desc(tripAnnouncements.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(tripAnnouncements)
        .where(eq(tripAnnouncements.tripId, tripId)),
    ]);

    return {
      items: rows.map((r) => this.toDto(r, r.createdByUsername)),
      total: countRow?.value ?? 0,
    };
  }

  async update(
    tripId: string,
    announcementId: string,
    callerId: string,
    dto: UpdateTripAnnouncementDto,
  ): Promise<TripAnnouncementResponseDto> {
    await this.assertTripOrganizer(tripId, callerId);

    const existing = await this.db.query.tripAnnouncements.findFirst({
      where: and(eq(tripAnnouncements.id, announcementId), eq(tripAnnouncements.tripId, tripId)),
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    const [updated] = await this.db
      .update(tripAnnouncements)
      .set({ content: dto.content })
      .where(and(eq(tripAnnouncements.id, announcementId), eq(tripAnnouncements.tripId, tripId)))
      .returning();

    if (!updated) throw new Error('Failed to update announcement');

    const creator = await this.db.query.users.findFirst({
      where: eq(users.id, existing.createdBy),
      columns: { username: true },
    });

    return this.toDto(updated, creator?.username ?? '');
  }

  async remove(tripId: string, announcementId: string, callerId: string): Promise<void> {
    await this.assertTripOrganizer(tripId, callerId);

    const existing = await this.db.query.tripAnnouncements.findFirst({
      where: and(eq(tripAnnouncements.id, announcementId), eq(tripAnnouncements.tripId, tripId)),
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    await this.db
      .delete(tripAnnouncements)
      .where(and(eq(tripAnnouncements.id, announcementId), eq(tripAnnouncements.tripId, tripId)));
  }

  private async assertTripOrganizer(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const membership = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.role, [...ORGANIZER_ROLES]),
      ),
    });
    if (!membership) throw new ForbiddenException('Only trip organizers can perform this action');
  }

  private async assertTripParticipant(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const membership = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, [...READER_STATUSES]),
      ),
    });
    if (!membership)
      throw new ForbiddenException(
        'Only accepted or confirmed participants can perform this action',
      );
  }

  private async assertTripExists(tripId: string): Promise<void> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
    });
    if (!trip) throw new NotFoundException('Trip not found');
  }

  private toDto(
    row: Pick<
      typeof tripAnnouncements.$inferSelect,
      'id' | 'tripId' | 'content' | 'createdAt' | 'updatedAt'
    >,
    createdByUsername: string,
  ): TripAnnouncementResponseDto {
    return {
      id: row.id,
      tripId: row.tripId,
      createdByUsername,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
