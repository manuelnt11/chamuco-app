import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';

@Injectable()
export class UsersHealthService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

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
    if (dto.bloodType !== undefined) patch.bloodType = dto.bloodType;
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

  private mapHealthResponse(profile: typeof userProfiles.$inferSelect): UserHealthResponseDto {
    return {
      bloodType: profile.bloodType ?? null,
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
