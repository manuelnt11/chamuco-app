import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import {
  DisabledNotificationChannels,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import type { NotificationPreferencesResponseDto } from './dto/notification-preferences-response.dto';
import type { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';

@Injectable()
export class UsersPreferencesService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async getPreferences(userId: string): Promise<UserPreferencesResponseDto> {
    const prefs = await this.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });
    if (!prefs) {
      throw new NotFoundException('User preferences not found');
    }
    return this.mapPreferencesResponse(prefs);
  }

  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const existing = await this.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });
    if (!existing) {
      throw new NotFoundException('User preferences not found');
    }

    const patch: Partial<typeof userPreferences.$inferInsert> = {};
    if (dto.language !== undefined) patch.language = dto.language;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.theme !== undefined) patch.theme = dto.theme;

    if (Object.keys(patch).length === 0) {
      return this.mapPreferencesResponse(existing);
    }

    const [updated] = await this.db
      .update(userPreferences)
      .set(patch)
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('User preferences not found');
    }
    return this.mapPreferencesResponse(updated);
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponseDto> {
    const prefs = await this.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });
    if (!prefs) {
      throw new NotFoundException('User preferences not found');
    }
    return { optOuts: prefs.notificationOptOuts ?? {} };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const sanitized = this.sanitizeNotificationPreferences(dto.optOuts);

    const [updated] = await this.db
      .update(userPreferences)
      .set({ notificationOptOuts: sanitized })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('User preferences not found');
    }
    return { optOuts: updated.notificationOptOuts ?? {} };
  }

  private mapPreferencesResponse(
    prefs: typeof userPreferences.$inferSelect,
  ): UserPreferencesResponseDto {
    return {
      language: prefs.language,
      currency: prefs.currency,
      theme: prefs.theme,
    };
  }

  private sanitizeNotificationPreferences(
    raw: DisabledNotificationChannels,
  ): DisabledNotificationChannels {
    const validTypes = new Set(Object.values(NotificationType));
    const validChannels = new Set(Object.values(NotificationChannel));
    const result: DisabledNotificationChannels = {};

    for (const [key, channels] of Object.entries(raw)) {
      if (!validTypes.has(key as NotificationType)) continue;
      if (!Array.isArray(channels)) continue;
      const valid = channels.filter((ch) =>
        validChannels.has(ch as NotificationChannel),
      ) as NotificationChannel[];
      if (valid.length > 0) {
        result[key as NotificationType] = valid;
      }
    }
    return result;
  }
}
