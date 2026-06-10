import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import type { DateOfBirthDto } from './dto/date-of-birth.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class UsersProfileService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return this.mapProfileResponse(profile);
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<UserProfileResponseDto> {
    const existing = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!existing) {
      throw new NotFoundException('User profile not found');
    }

    const patch: Partial<typeof userProfiles.$inferInsert> = {};
    if (dto.firstName !== undefined) patch.firstName = dto.firstName;
    if (dto.lastName !== undefined) patch.lastName = dto.lastName;
    if (dto.dateOfBirth !== undefined) {
      const { yearVisible, ...rest } = dto.dateOfBirth;
      patch.dateOfBirth = { ...rest, year_visible: yearVisible };
    }
    if (dto.birthCountry !== undefined) patch.birthCountry = dto.birthCountry;
    if (dto.birthCity !== undefined) patch.birthCity = dto.birthCity?.trim() || null;
    if (dto.homeCountry !== undefined) patch.homeCountry = dto.homeCountry;
    if (dto.homeCity !== undefined) patch.homeCity = dto.homeCity?.trim() || null;
    if (dto.phoneCountryCode !== undefined) patch.phoneCountryCode = dto.phoneCountryCode;
    if (dto.phoneLocalNumber !== undefined) patch.phoneLocalNumber = dto.phoneLocalNumber;
    if (dto.bio !== undefined) patch.bio = dto.bio?.trim() || null;
    if (dto.email !== undefined) {
      patch.email = dto.email.trim().toLowerCase();
      if (patch.email !== existing.email) patch.emailVerified = false;
    }

    if (Object.keys(patch).length === 0) {
      return this.mapProfileResponse(existing);
    }

    const [updated] = await this.db
      .update(userProfiles)
      .set(patch)
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException('User profile not found');
    }
    return this.mapProfileResponse(updated);
  }

  private mapProfileResponse(profile: typeof userProfiles.$inferSelect): UserProfileResponseDto {
    const dob = profile.dateOfBirth as {
      day: number;
      month: number;
      year: number;
      year_visible: boolean;
    };
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: {
        day: dob.day,
        month: dob.month,
        year: dob.year,
        yearVisible: dob.year_visible,
      } satisfies DateOfBirthDto,
      birthCountry: profile.birthCountry ?? null,
      birthCity: profile.birthCity ?? null,
      homeCountry: profile.homeCountry,
      homeCity: profile.homeCity ?? null,
      phoneCountryCode: profile.phoneCountryCode,
      phoneLocalNumber: profile.phoneLocalNumber,
      bio: profile.bio ?? null,
      email: profile.email,
      emailVerified: profile.emailVerified,
      phoneVerified: profile.phoneVerified,
    };
  }
}
