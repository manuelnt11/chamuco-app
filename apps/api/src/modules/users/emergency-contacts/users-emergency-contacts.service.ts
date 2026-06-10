import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';

@Injectable()
export class UsersEmergencyContactsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

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
}
