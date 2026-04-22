import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userNationalities } from '@/modules/users/schema/user-nationalities.schema';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { users } from '@/modules/users/schema/users.schema';
import { PassportStatus, ProfileVisibility } from '@chamuco/shared-types';
import { computePassportStatus } from '@/common/utils/passport-status.util';
import type { AuthenticatedUser } from '@/types/express';
import type { DateOfBirthDto } from './dto/date-of-birth.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type {
  CreateNationalityDto,
  NationalityResponseDto,
  UpdateNationalityDto,
} from './dto/nationality.dto';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import type { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './dto/loyalty-program.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import type { UpdateUserHealthDto } from './dto/update-user-health.dto';
import type { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { UserHealthResponseDto } from './dto/user-health-response.dto';
import type { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import type { UserProfileResponseDto } from './dto/user-profile-response.dto';
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
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl?.trim() || null;
    if (dto.timezone !== undefined) patch.timezone = dto.timezone;
    if (dto.profileVisibility !== undefined) patch.profileVisibility = dto.profileVisibility;

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

  async getEmergencyContacts(userId: string): Promise<EmergencyContactDto[]> {
    const { contacts } = await this.fetchContacts(userId);
    return contacts;
  }

  async addEmergencyContact(
    userId: string,
    dto: EmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    const { contacts } = await this.fetchContacts(userId);

    const updated = dto.isPrimary
      ? contacts.map((c) => ({ ...c, isPrimary: false }))
      : [...contacts];
    updated.push(dto);

    const [saved] = await this.db
      .update(userProfiles)
      .set({ emergencyContacts: updated })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!saved) {
      throw new NotFoundException('User profile not found');
    }
    return (saved.emergencyContacts as EmergencyContactDto[]).find((c) => c.id === dto.id)!;
  }

  async updateEmergencyContact(
    userId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    const { contacts } = await this.fetchContacts(userId);

    const index = contacts.findIndex((c) => c.id === contactId);
    if (index === -1) {
      throw new NotFoundException('Emergency contact not found');
    }

    if (dto.isPrimary === false) {
      throw new BadRequestException(
        'Cannot unset the primary contact directly — assign a new primary first.',
      );
    }

    const withPrimary =
      dto.isPrimary === true
        ? contacts.map((c) => ({ ...c, isPrimary: c.id === contactId }))
        : contacts;

    const updated = withPrimary.map((c, i) =>
      i === index
        ? { ...c, ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)) }
        : c,
    );

    const [saved] = await this.db
      .update(userProfiles)
      .set({ emergencyContacts: updated })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!saved) {
      throw new NotFoundException('User profile not found');
    }
    return (saved.emergencyContacts as EmergencyContactDto[]).find((c) => c.id === contactId)!;
  }

  async deleteEmergencyContact(userId: string, contactId: string): Promise<void> {
    const { contacts } = await this.fetchContacts(userId);

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    if (contact.isPrimary && contacts.length > 1) {
      throw new ConflictException(
        'Cannot delete the primary emergency contact. Re-assign primary first.',
      );
    }

    const updated = contacts.filter((c) => c.id !== contactId);

    await this.db
      .update(userProfiles)
      .set({ emergencyContacts: updated })
      .where(eq(userProfiles.userId, userId));
  }

  async getNationalities(userId: string): Promise<NationalityResponseDto[]> {
    const records = await this.db.query.userNationalities.findMany({
      where: eq(userNationalities.userId, userId),
      orderBy: (t, { desc, asc }) => [desc(t.isPrimary), asc(t.countryCode)],
    });
    return records.map((r) => this.mapNationalityResponse(r));
  }

  async addNationality(userId: string, dto: CreateNationalityDto): Promise<NationalityResponseDto> {
    const existing = await this.db.query.userNationalities.findFirst({
      where: and(
        eq(userNationalities.userId, userId),
        eq(userNationalities.countryCode, dto.countryCode),
      ),
    });
    if (existing) {
      throw new ConflictException('Nationality for this country already exists');
    }

    if (dto.isPrimary) {
      await this.db
        .update(userNationalities)
        .set({ isPrimary: false })
        .where(and(eq(userNationalities.userId, userId), eq(userNationalities.isPrimary, true)));
    }

    const passportStatus = computePassportStatus(dto.passportExpiryDate);

    const [inserted] = await this.db
      .insert(userNationalities)
      .values({
        userId,
        countryCode: dto.countryCode,
        isPrimary: dto.isPrimary,
        nationalIdNumber: dto.nationalIdNumber ?? null,
        passportNumber: dto.passportNumber ?? null,
        passportIssueDate: dto.passportIssueDate ?? null,
        passportExpiryDate: dto.passportExpiryDate ?? null,
        passportStatus,
      })
      .returning();

    if (!inserted) {
      throw new NotFoundException('Nationality not found after insert');
    }
    return this.mapNationalityResponse(inserted);
  }

  async updateNationality(
    userId: string,
    nationalityId: string,
    dto: UpdateNationalityDto,
  ): Promise<NationalityResponseDto> {
    const existing = await this.db.query.userNationalities.findFirst({
      where: and(eq(userNationalities.id, nationalityId), eq(userNationalities.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundException('Nationality not found');
    }

    if (dto.isPrimary === false) {
      throw new BadRequestException(
        'Cannot unset the primary nationality directly — assign a new primary first.',
      );
    }

    if (dto.isPrimary === true) {
      await this.db
        .update(userNationalities)
        .set({ isPrimary: false })
        .where(and(eq(userNationalities.userId, userId), ne(userNationalities.id, nationalityId)));
    }

    const passportChanged =
      dto.passportNumber !== undefined ||
      dto.passportIssueDate !== undefined ||
      dto.passportExpiryDate !== undefined;

    const patch: Partial<typeof userNationalities.$inferInsert> = {};
    if (dto.isPrimary !== undefined) patch.isPrimary = dto.isPrimary;
    if (dto.nationalIdNumber !== undefined) patch.nationalIdNumber = dto.nationalIdNumber;
    if (dto.passportNumber !== undefined) patch.passportNumber = dto.passportNumber ?? null;
    if (dto.passportIssueDate !== undefined)
      patch.passportIssueDate = dto.passportIssueDate ?? null;
    if (dto.passportExpiryDate !== undefined)
      patch.passportExpiryDate = dto.passportExpiryDate ?? null;
    if (passportChanged) patch.passportStatus = computePassportStatus(dto.passportExpiryDate);

    if (Object.keys(patch).length === 0) {
      return this.mapNationalityResponse(existing);
    }

    const [updated] = await this.db
      .update(userNationalities)
      .set(patch)
      .where(and(eq(userNationalities.id, nationalityId), eq(userNationalities.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundException('Nationality not found');
    }
    return this.mapNationalityResponse(updated);
  }

  async deleteNationality(userId: string, nationalityId: string): Promise<void> {
    const all = await this.db.query.userNationalities.findMany({
      where: eq(userNationalities.userId, userId),
    });

    const target = all.find((n) => n.id === nationalityId);
    if (!target) {
      throw new NotFoundException('Nationality not found');
    }

    if (target.isPrimary && all.length > 1) {
      throw new ConflictException(
        'Cannot delete the primary nationality. Re-assign primary first.',
      );
    }

    await this.db
      .delete(userNationalities)
      .where(and(eq(userNationalities.id, nationalityId), eq(userNationalities.userId, userId)));
  }

  async getPublicProfile(username: string): Promise<PublicProfileResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const showGamification = user.profileVisibility === ProfileVisibility.PUBLIC;

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      bio: profile?.bio ?? null,
      profileVisibility: user.profileVisibility,
      travelerScore: null,
      achievements: showGamification ? [] : null,
      recognitions: showGamification ? [] : null,
      keyStats: null,
      discoveryMap: showGamification ? [] : null,
    };
  }

  async getLoyaltyPrograms(userId: string): Promise<LoyaltyProgramDto[]> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);
    return programs;
  }

  async addLoyaltyProgram(userId: string, dto: LoyaltyProgramDto): Promise<LoyaltyProgramDto> {
    const { programs } = await this.fetchLoyaltyPrograms(userId);

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

    const updated = programs.map((p: LoyaltyProgramDto, i: number) =>
      i === index
        ? { ...p, ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)) }
        : p,
    );

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

  private mapNationalityResponse(
    record: typeof userNationalities.$inferSelect,
  ): NationalityResponseDto {
    return {
      id: record.id,
      countryCode: record.countryCode,
      isPrimary: record.isPrimary,
      nationalIdNumber: record.nationalIdNumber ?? null,
      passportNumber: record.passportNumber ?? null,
      passportIssueDate: record.passportIssueDate ?? null,
      passportExpiryDate: record.passportExpiryDate ?? null,
      passportStatus: record.passportStatus as PassportStatus,
    };
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

  private async fetchContacts(
    userId: string,
  ): Promise<{ profile: typeof userProfiles.$inferSelect; contacts: EmergencyContactDto[] }> {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return {
      profile,
      contacts: (profile.emergencyContacts as EmergencyContactDto[]) ?? [],
    };
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
