import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { users } from '@/modules/users/schema/users.schema';
import type { AuthenticatedUser } from '@/types/express';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UsernameAvailabilityDto } from './dto/username-availability.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async findByFirebaseUid(firebaseUid: string): Promise<AuthenticatedUser> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, firebaseUid),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityDto> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return { available: !existing, username };
  }

  async updateMe(existingUser: AuthenticatedUser, dto: UpdateUserDto): Promise<UserResponseDto> {
    const patch: Partial<typeof users.$inferInsert> = {};
    if (dto.displayName !== undefined) patch.displayName = dto.displayName.trim();
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.timezone !== undefined) patch.timezone = dto.timezone;

    if (Object.keys(patch).length === 0) {
      return this.mapUserResponse(existingUser);
    }

    const [updated] = await this.db
      .update(users)
      .set(patch)
      .where(eq(users.id, existingUser.id))
      .returning();

    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserResponse(updated);
  }

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

  async getHealth(userId: string): Promise<UserHealthResponseDto> {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return this.mapHealthResponse(profile);
  }

  async updateHealth(userId: string, dto: UpdateUserHealthDto): Promise<UserHealthResponseDto> {
    const existing = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!existing) {
      throw new NotFoundException('User profile not found');
    }

    const patch: Partial<typeof userProfiles.$inferInsert> = {};
    if (dto.dietaryPreference !== undefined) patch.dietaryPreference = dto.dietaryPreference;
    if (dto.dietaryNotes !== undefined) patch.dietaryNotes = dto.dietaryNotes?.trim() || null;
    if (dto.generalMedicalNotes !== undefined)
      patch.generalMedicalNotes = dto.generalMedicalNotes?.trim() || null;
    if (dto.foodAllergies !== undefined) patch.foodAllergies = dto.foodAllergies;
    if (dto.phobias !== undefined) patch.phobias = dto.phobias;
    if (dto.physicalLimitations !== undefined) patch.physicalLimitations = dto.physicalLimitations;
    if (dto.medicalConditions !== undefined) patch.medicalConditions = dto.medicalConditions;

    if (Object.keys(patch).length === 0) {
      return this.mapHealthResponse(existing);
    }

    const [updated] = await this.db
      .update(userProfiles)
      .set(patch)
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('User profile not found');
    }
    return this.mapHealthResponse(updated);
  }

  private mapUserResponse(user: typeof users.$inferSelect): UserResponseDto {
    const { firebaseUid: _, ...dto } = user;
    return dto;
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

  private mapHealthResponse(profile: typeof userProfiles.$inferSelect): UserHealthResponseDto {
    return {
      dietaryPreference: profile.dietaryPreference,
      dietaryNotes: profile.dietaryNotes ?? null,
      generalMedicalNotes: profile.generalMedicalNotes ?? null,
      foodAllergies: (profile.foodAllergies as UserHealthResponseDto['foodAllergies']) ?? [],
      phobias: (profile.phobias as UserHealthResponseDto['phobias']) ?? [],
      physicalLimitations:
        (profile.physicalLimitations as UserHealthResponseDto['physicalLimitations']) ?? [],
      medicalConditions:
        (profile.medicalConditions as UserHealthResponseDto['medicalConditions']) ?? [],
    };
  }
}
