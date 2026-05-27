import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
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
import { buildNotificationContent } from './notification-content.builder';
import { EMAIL_STRATEGY, PUSH_STRATEGY, SMS_STRATEGY } from './notifications.constants';
import type {
  NotificationChannelStrategy,
  NotificationRow,
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
    const { title, body } = this.renderContent(type, payload, lang);
    const [notification] = await this.db
      .insert(notifications)
      .values({ userId, type, title, body, data: payload })
      .returning();

    // insert().returning() always yields a row on success — non-null is safe here
    if (channels.length === 0) return;
    const prefsMap = await this.fetchPrefsMap([userId]);
    const disabled = prefsMap.get(userId)?.[type] ?? [];
    const effectiveChannels = channels.filter((ch) => !disabled.includes(ch));
    await this.dispatchChannels([notification!], payload, effectiveChannels);
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

    const { title, body } = this.renderContent(type, payload, lang);
    const values = userIds.map((userId) => ({ userId, type, title, body, data: payload }));

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
    const groups = new Map<string, { rows: NotificationRow[]; channels: NotificationChannel[] }>();
    for (const row of inserted) {
      const disabled = prefsMap.get(row.userId)?.[type] ?? [];
      const effective = channels.filter((ch) => !disabled.includes(ch));
      if (effective.length === 0) continue;
      const key = [...effective].sort().join(',');
      if (!groups.has(key)) groups.set(key, { rows: [], channels: effective });
      groups.get(key)!.rows.push(row);
    }
    await Promise.allSettled(
      Array.from(groups.values()).map((g) => this.dispatchChannels(g.rows, payload, g.channels)),
    );
  }

  async findAll(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ items: NotificationRow[]; nextCursor: string | null }> {
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
    const items = hasMore ? rows.slice(0, limit) : rows;
    // hasMore guarantees items is non-empty (length === limit > 0)
    const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : null;

    return { items, nextCursor };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
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
  ): { title: string; body: string } {
    const { titleKey, bodyKey, args } = buildNotificationContent(type, payload);
    return {
      title: this.i18n.translate(titleKey, { lang, args }),
      body: this.i18n.translate(bodyKey, { lang, args }),
    };
  }

  private async dispatchChannels(
    inserted: NotificationRow[],
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
  ): Promise<void> {
    if (channels.length === 0) return;

    const deliveryRows = inserted.flatMap((n) =>
      channels.map((channel) => ({
        notificationId: n.id,
        channel,
        status: DeliveryStatus.PENDING as const,
      })),
    );

    await this.db.insert(notificationDeliveries).values(deliveryRows);

    await Promise.allSettled(
      inserted.flatMap((n) =>
        channels.map((channel) =>
          this.strategies[channel].send(n, payload).catch((err: unknown) => {
            this.logger.error(`Channel ${channel} dispatch failed for notification ${n.id}`, err);
          }),
        ),
      ),
    );
  }
}
