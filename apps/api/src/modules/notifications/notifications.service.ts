import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import {
  DeliveryStatus,
  DisabledNotificationChannels,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { I18nService, SupportedLanguage } from '@/i18n/i18n.service';
import { notifications } from '@/modules/notifications/schema/notifications.schema';
import { notificationDeliveries } from '@/modules/notifications/schema/notification-deliveries.schema';
import { userFcmTokens } from '@/modules/notifications/schema/user-fcm-tokens.schema';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupAnnouncements } from '@/modules/groups/schema/group-announcements.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripAnnouncements } from '@/modules/trips/schema/trip-announcements.schema';
import { users } from '@/modules/users/schema/users.schema';
import { buildNotificationContent } from './notification-content.builder';
import { EMAIL_STRATEGY, PUSH_STRATEGY, SMS_STRATEGY } from './notifications.constants';
import type {
  DispatchableNotification,
  NotificationChannelStrategy,
  RenderedNotification,
} from './channel-strategies/notification-channel.strategy';
import type { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import type { DeleteFcmTokenDto } from './dto/delete-fcm-token.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly strategies: Record<NotificationChannel, NotificationChannelStrategy>;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly i18n: I18nService,
    @Inject(PUSH_STRATEGY) push: NotificationChannelStrategy,
    @Inject(EMAIL_STRATEGY) email: NotificationChannelStrategy,
    @Inject(SMS_STRATEGY) sms: NotificationChannelStrategy,
  ) {
    this.strategies = {
      [NotificationChannel.PUSH]: push,
      [NotificationChannel.EMAIL]: email,
      [NotificationChannel.SMS]: sms,
    };
  }

  async notify(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
    // TODO: replace default with user.preferredLanguage once user language preferences are implemented
    lang: SupportedLanguage = 'es',
  ): Promise<void> {
    const { title, body, url } = this.renderContent(type, payload, lang);
    const [row] = await this.db
      .insert(notifications)
      .values({ userId, type, data: payload })
      .returning();

    // insert().returning() always yields a row on success — non-null is safe here
    if (channels.length === 0) return;
    const prefsMap = await this.fetchPrefsMap([userId]);
    const disabled = prefsMap.get(userId)?.[type] ?? [];
    const effectiveChannels = channels.filter((ch) => !disabled.includes(ch));
    const dispatchable: DispatchableNotification = {
      id: row!.id,
      userId: row!.userId,
      title,
      body,
      url,
    };
    await this.dispatchChannels([dispatchable], payload, effectiveChannels);
  }

  async notifyMany(
    userIds: string[],
    type: NotificationType,
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
    // TODO: replace default with per-user language lookup once preferences are implemented
    lang: SupportedLanguage = 'es',
  ): Promise<void> {
    if (userIds.length === 0) return;

    const { title, body, url } = this.renderContent(type, payload, lang);
    const values = userIds.map((userId) => ({ userId, type, data: payload }));

    // Single batch insert — acceptable at current group/trip scale (~100 members max).
    // If userIds can grow to thousands, chunk into batches of ~500 to avoid Postgres
    // parameter limits and memory pressure.
    if (channels.length === 0) {
      await this.db.insert(notifications).values(values);
      return;
    }

    const inserted = await this.db.insert(notifications).values(values).returning();

    const prefsMap = await this.fetchPrefsMap(userIds);
    // Group rows by effective channel set to minimise dispatchChannels calls
    const groupedByChannel = new Map<
      string,
      { dispatchables: DispatchableNotification[]; channels: NotificationChannel[] }
    >();
    for (const row of inserted) {
      const disabled = prefsMap.get(row.userId)?.[type] ?? [];
      const effective = channels.filter((ch) => !disabled.includes(ch));
      if (effective.length === 0) continue;
      const key = [...effective].sort().join(',');
      if (!groupedByChannel.has(key))
        groupedByChannel.set(key, { dispatchables: [], channels: effective });
      groupedByChannel
        .get(key)!
        .dispatchables.push({ id: row.id, userId: row.userId, title, body, url });
    }
    await Promise.allSettled(
      Array.from(groupedByChannel.values()).map((g) =>
        this.dispatchChannels(g.dispatchables, payload, g.channels),
      ),
    );
  }

  async findAll(
    userId: string,
    cursor?: string,
    limit = 20,
    lang: SupportedLanguage = 'es',
  ): Promise<{ items: RenderedNotification[]; nextCursor: string | null }> {
    if (cursor !== undefined && isNaN(new Date(cursor).getTime())) {
      throw new BadRequestException('Invalid cursor: must be an ISO 8601 timestamp');
    }

    // Cursor is a single createdAt timestamp. Two notifications inserted within the same
    // millisecond (e.g. notifyMany batch) could produce duplicate or skipped items.
    // A composite cursor (createdAt|id) would be strictly correct — acceptable trade-off for MVP.
    const rows = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          cursor ? lt(notifications.createdAt, new Date(cursor)) : undefined,
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const rawItems = hasMore ? rows.slice(0, limit) : rows;

    const enrichedPayloads = await this.enrichPayloads(rawItems);

    const items: RenderedNotification[] = rawItems.map((row) => ({
      ...row,
      ...this.renderContent(
        row.type,
        enrichedPayloads.get(row.id) ?? ((row.data ?? {}) as Record<string, unknown>),
        lang,
      ),
    }));

    // hasMore guarantees rawItems is non-empty (length === limit > 0)
    const nextCursor = hasMore ? rawItems[rawItems.length - 1]!.createdAt.toISOString() : null;

    return { items, nextCursor };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });

    if (!updated) throw new NotFoundException('Notification not found');
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return result[0]?.count ?? 0;
  }

  async registerToken(userId: string, dto: RegisterFcmTokenDto): Promise<void> {
    await this.db
      .insert(userFcmTokens)
      .values({ userId, token: dto.token, deviceHint: dto.deviceHint ?? null })
      .onConflictDoUpdate({
        target: [userFcmTokens.userId, userFcmTokens.token],
        // deviceHint is intentionally not refreshed on conflict — the token identity
        // is stable, and a stale hint is harmless (used only for human-readable display).
        set: { lastUsedAt: sql`now()` },
      });
  }

  async deleteToken(userId: string, dto: DeleteFcmTokenDto): Promise<void> {
    await this.db
      .delete(userFcmTokens)
      .where(and(eq(userFcmTokens.userId, userId), eq(userFcmTokens.token, dto.token)));
  }

  private async fetchPrefsMap(
    userIds: string[],
  ): Promise<Map<string, DisabledNotificationChannels>> {
    const rows = await this.db.query.userPreferences.findMany({
      where: inArray(userPreferences.userId, userIds),
      columns: { userId: true, notificationOptOuts: true },
    });
    return new Map(rows.map((r) => [r.userId, r.notificationOptOuts ?? {}]));
  }

  private renderContent(
    type: NotificationType,
    payload: Record<string, unknown>,
    lang: SupportedLanguage,
  ): { title: string; body: string; url: string | null } {
    const { titleKey, bodyKey, args, url } = buildNotificationContent(type, payload);
    return {
      title: this.i18n.translate(titleKey, { lang, args }),
      body: this.i18n.translate(bodyKey, { lang, args }),
      url,
    };
  }

  private async enrichPayloads(
    rows: Array<{ id: string; type: NotificationType; data: unknown }>,
  ): Promise<Map<string, Record<string, unknown>>> {
    const result = new Map<string, Record<string, unknown>>();

    const groupIdsNeeded = new Set<string>();
    const groupAnnouncementIdsNeeded = new Set<string>();
    const tripIdsNeeded = new Set<string>();
    const tripAnnouncementIdsNeeded = new Set<string>();

    for (const row of rows) {
      const data = (row.data ?? {}) as Record<string, unknown>;
      result.set(row.id, { ...data });

      if (typeof data.groupId === 'string' && typeof data.groupName !== 'string') {
        groupIdsNeeded.add(data.groupId);
      }
      if (
        row.type === NotificationType.GROUP_ANNOUNCEMENT &&
        typeof data.announcementId === 'string' &&
        typeof data.senderUsername !== 'string'
      ) {
        groupAnnouncementIdsNeeded.add(data.announcementId);
      }
      if (typeof data.tripId === 'string' && typeof data.tripName !== 'string') {
        tripIdsNeeded.add(data.tripId);
      }
      if (
        row.type === NotificationType.TRIP_ANNOUNCEMENT &&
        typeof data.announcementId === 'string' &&
        typeof data.senderUsername !== 'string'
      ) {
        tripAnnouncementIdsNeeded.add(data.announcementId);
      }
    }

    const groupNameMap = new Map<string, string>();
    const groupAnnouncementSenderMap = new Map<string, string>();
    const tripNameMap = new Map<string, string>();
    const tripAnnouncementSenderMap = new Map<string, string>();

    await Promise.all([
      (async () => {
        if (groupIdsNeeded.size === 0) return;
        const fetched = await this.db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(inArray(groups.id, [...groupIdsNeeded]));
        for (const r of fetched) groupNameMap.set(r.id, r.name);
      })(),
      (async () => {
        if (groupAnnouncementIdsNeeded.size === 0) return;
        const fetched = await this.db
          .select({ id: groupAnnouncements.id, username: users.username })
          .from(groupAnnouncements)
          .innerJoin(users, eq(groupAnnouncements.createdBy, users.id))
          .where(inArray(groupAnnouncements.id, [...groupAnnouncementIdsNeeded]));
        for (const r of fetched) groupAnnouncementSenderMap.set(r.id, r.username);
      })(),
      (async () => {
        if (tripIdsNeeded.size === 0) return;
        const fetched = await this.db
          .select({ id: trips.id, name: trips.name })
          .from(trips)
          .where(inArray(trips.id, [...tripIdsNeeded]));
        for (const r of fetched) tripNameMap.set(r.id, r.name);
      })(),
      (async () => {
        if (tripAnnouncementIdsNeeded.size === 0) return;
        const fetched = await this.db
          .select({ id: tripAnnouncements.id, username: users.username })
          .from(tripAnnouncements)
          .innerJoin(users, eq(tripAnnouncements.createdBy, users.id))
          .where(inArray(tripAnnouncements.id, [...tripAnnouncementIdsNeeded]));
        for (const r of fetched) tripAnnouncementSenderMap.set(r.id, r.username);
      })(),
    ]);

    for (const row of rows) {
      const enriched = result.get(row.id)!;
      if (groupIdsNeeded.has(enriched.groupId as string)) {
        const name = groupNameMap.get(enriched.groupId as string);
        if (name !== undefined) enriched.groupName = name;
      }
      if (groupAnnouncementIdsNeeded.has(enriched.announcementId as string)) {
        const username = groupAnnouncementSenderMap.get(enriched.announcementId as string);
        if (username !== undefined) enriched.senderUsername = username;
      }
      if (tripIdsNeeded.has(enriched.tripId as string)) {
        const name = tripNameMap.get(enriched.tripId as string);
        if (name !== undefined) enriched.tripName = name;
      }
      if (tripAnnouncementIdsNeeded.has(enriched.announcementId as string)) {
        const username = tripAnnouncementSenderMap.get(enriched.announcementId as string);
        if (username !== undefined) enriched.senderUsername = username;
      }
    }

    return result;
  }

  private async dispatchChannels(
    dispatchables: DispatchableNotification[],
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
  ): Promise<void> {
    if (channels.length === 0) return;

    const deliveryRows = dispatchables.flatMap((n) =>
      channels.map((channel) => ({
        notificationId: n.id,
        channel,
        status: DeliveryStatus.PENDING as const,
      })),
    );

    await this.db.insert(notificationDeliveries).values(deliveryRows);

    await Promise.allSettled(
      dispatchables.flatMap((n) =>
        channels.map((channel) =>
          this.strategies[channel].send(n, payload).catch((err: unknown) => {
            this.logger.error(`Channel ${channel} dispatch failed for notification ${n.id}`, err);
          }),
        ),
      ),
    );
  }
}
