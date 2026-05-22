import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import {
  DeliveryStatus,
  NotificationChannel,
  NotificationType,
  PassportStatus,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { notifications } from '@/modules/notifications/schema/notifications.schema';
import { notificationDeliveries } from '@/modules/notifications/schema/notification-deliveries.schema';
import { buildNotificationContent } from './notification-content.builder';
import { EMAIL_STRATEGY, PUSH_STRATEGY, SMS_STRATEGY } from './notifications.constants';
import type {
  NotificationChannelStrategy,
  NotificationRow,
} from './channel-strategies/notification-channel.strategy';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly strategies: Record<NotificationChannel, NotificationChannelStrategy>;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
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
  ): Promise<void> {
    const { title, body } = buildNotificationContent(type, payload);
    const [notification] = await this.db
      .insert(notifications)
      .values({ userId, type, title, body, data: payload })
      .returning();

    // insert().returning() always yields a row on success — non-null is safe here
    await this.dispatchChannels([notification!], payload, channels);
  }

  async notifyMany(
    userIds: string[],
    type: NotificationType,
    payload: Record<string, unknown>,
    channels: NotificationChannel[],
  ): Promise<void> {
    if (userIds.length === 0) return;

    const { title, body } = buildNotificationContent(type, payload);
    const inserted = await this.db
      .insert(notifications)
      .values(userIds.map((userId) => ({ userId, type, title, body, data: payload })))
      .returning();

    await this.dispatchChannels(inserted, payload, channels);
  }

  async findAll(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ items: NotificationRow[]; nextCursor: string | null }> {
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

  async sendPassportStatusNotification(
    userId: string,
    countryCode: string,
    status: PassportStatus.EXPIRING_SOON | PassportStatus.EXPIRED,
  ): Promise<void> {
    const type =
      status === PassportStatus.EXPIRING_SOON
        ? NotificationType.PASSPORT_EXPIRING_SOON
        : NotificationType.PASSPORT_EXPIRED;

    await this.notify(userId, type, { countryCode }, []);
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
