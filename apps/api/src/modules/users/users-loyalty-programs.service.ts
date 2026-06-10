import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import type { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './dto/loyalty-program.dto';

@Injectable()
export class UsersLoyaltyProgramsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async getLoyaltyPrograms(userId: string): Promise<LoyaltyProgramDto[]> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);
    return programs;
  }

  async addLoyaltyProgram(userId: string, dto: LoyaltyProgramDto): Promise<LoyaltyProgramDto> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);

    const nameNorm = dto.programName.trim().toLowerCase();
    const memberNorm = dto.memberId.trim().toLowerCase();
    const duplicate = programs.some(
      (p) =>
        p.programName.trim().toLowerCase() === nameNorm &&
        p.memberId.trim().toLowerCase() === memberNorm,
    );
    if (duplicate) {
      throw new ConflictException('Loyalty program with this name and member ID already exists');
    }

    const [saved] = await this.db
      .update(userProfiles)
      .set({ loyaltyPrograms: [...programs, dto] })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!saved) {
      throw new NotFoundException('User profile not found');
    }
    return (saved.loyaltyPrograms as LoyaltyProgramDto[]).find(
      (p: LoyaltyProgramDto) => p.id === dto.id,
    )!;
  }

  async updateLoyaltyProgram(
    userId: string,
    programId: string,
    dto: UpdateLoyaltyProgramDto,
  ): Promise<LoyaltyProgramDto> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);

    const index = programs.findIndex((p) => p.id === programId);
    if (index === -1) {
      throw new NotFoundException('Loyalty program not found');
    }

    const updated = programs.map((p: LoyaltyProgramDto, i: number) => {
      if (i !== index) return p;
      return {
        ...p,
        ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)),
      } as LoyaltyProgramDto;
    });

    const [saved] = await this.db
      .update(userProfiles)
      .set({ loyaltyPrograms: updated })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!saved) {
      throw new NotFoundException('User profile not found');
    }
    return (saved.loyaltyPrograms as LoyaltyProgramDto[]).find(
      (p: LoyaltyProgramDto) => p.id === programId,
    )!;
  }

  async deleteLoyaltyProgram(userId: string, programId: string): Promise<void> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);

    const program = programs.find((p: LoyaltyProgramDto) => p.id === programId);
    if (!program) {
      throw new NotFoundException('Loyalty program not found');
    }

    const updated = programs.filter((p: LoyaltyProgramDto) => p.id !== programId);

    await this.db
      .update(userProfiles)
      .set({ loyaltyPrograms: updated })
      .where(eq(userProfiles.userId, userId));
  }

  private async fetchLoyaltyPrograms(
    userId: string,
  ): Promise<{ profile: typeof userProfiles.$inferSelect; programs: LoyaltyProgramDto[] }> {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return { profile, programs: (profile.loyaltyPrograms as LoyaltyProgramDto[]) ?? [] };
  }
}
