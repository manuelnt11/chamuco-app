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
import { userEtas } from '@/modules/users/schema/user-etas.schema';
import { userVisas } from '@/modules/users/schema/user-visas.schema';
import { DocumentStatus, PassportStatus } from '@chamuco/shared-types';
import { computeDocumentStatus } from '@/common/utils/document-status.util';
import { computePassportStatus } from '@/common/utils/passport-status.util';
import type {
  CreateNationalityDto,
  NationalityResponseDto,
  UpdateNationalityDto,
} from './dto/nationality.dto';
import type { CreateVisaDto, UpdateVisaDto, VisaResponseDto } from './dto/visa.dto';
import type { CreateEtaDto, EtaResponseDto, UpdateEtaDto } from './dto/eta.dto';

@Injectable()
export class UsersTravelDocsService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

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

    const passportChanged =
      dto.passportNumber !== undefined ||
      dto.passportIssueDate !== undefined ||
      dto.passportExpiryDate !== undefined;

    const passportNumberChanged =
      dto.passportNumber !== undefined && dto.passportNumber !== existing.passportNumber;

    const patch: Partial<typeof userNationalities.$inferInsert> = {};
    if (dto.isPrimary !== undefined) patch.isPrimary = dto.isPrimary;
    if (dto.nationalIdNumber !== undefined) patch.nationalIdNumber = dto.nationalIdNumber;
    if (dto.passportNumber !== undefined) patch.passportNumber = dto.passportNumber ?? null;
    if (dto.passportIssueDate !== undefined)
      patch.passportIssueDate = dto.passportIssueDate ?? null;
    if (dto.passportExpiryDate !== undefined)
      patch.passportExpiryDate = dto.passportExpiryDate ?? null;
    if (passportChanged) patch.passportStatus = computePassportStatus(dto.passportExpiryDate);

    const shouldDemotePrimary = dto.isPrimary === true;
    const shouldExpireEtas = passportNumberChanged && !!existing.passportNumber;

    if (!shouldDemotePrimary && !shouldExpireEtas && Object.keys(patch).length === 0) {
      return this.mapNationalityResponse(existing);
    }

    if (shouldDemotePrimary || shouldExpireEtas) {
      const result = await this.db.transaction(async (trx) => {
        if (shouldDemotePrimary) {
          await trx
            .update(userNationalities)
            .set({ isPrimary: false })
            .where(
              and(eq(userNationalities.userId, userId), ne(userNationalities.id, nationalityId)),
            );
        }

        if (shouldExpireEtas) {
          await trx
            .update(userEtas)
            .set({ etaStatus: DocumentStatus.EXPIRED, updatedAt: new Date() })
            .where(
              and(
                eq(userEtas.userNationalityId, nationalityId),
                eq(userEtas.passportNumber, existing.passportNumber!),
                ne(userEtas.etaStatus, DocumentStatus.EXPIRED),
              ),
            );
        }

        const [updated] = await trx
          .update(userNationalities)
          .set(patch)
          .where(and(eq(userNationalities.id, nationalityId), eq(userNationalities.userId, userId)))
          .returning();

        if (!updated) throw new NotFoundException('Nationality not found');
        return updated;
      });

      return this.mapNationalityResponse(result);
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

  // ---------------------------------------------------------------------------
  // Visas
  // ---------------------------------------------------------------------------

  async getVisas(userId: string, nationalityId: string): Promise<VisaResponseDto[]> {
    await this.requireNationality(userId, nationalityId);
    const records = await this.db.query.userVisas.findMany({
      where: eq(userVisas.nationalityId, nationalityId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return records.map((r) => this.mapVisaResponse(r));
  }

  async addVisa(
    userId: string,
    nationalityId: string,
    dto: CreateVisaDto,
  ): Promise<VisaResponseDto> {
    const nationality = await this.requireNationality(userId, nationalityId);
    if (nationality.passportStatus === PassportStatus.OMITTED) {
      throw new BadRequestException('Cannot add visas to a nationality without passport data');
    }
    if (!!dto.countryCode && !!dto.visaZone) {
      throw new BadRequestException(
        'countryCode and visaZone are mutually exclusive — provide only the one matching coverageType',
      );
    }

    const [inserted] = await this.db
      .insert(userVisas)
      .values({
        nationalityId,
        coverageType: dto.coverageType,
        countryCode: dto.countryCode ?? null,
        visaZone: dto.visaZone ?? null,
        visaType: dto.visaType,
        entries: dto.entries,
        expiryDate: dto.expiryDate,
        visaStatus: computeDocumentStatus(dto.expiryDate),
        notes: dto.notes ?? null,
      })
      .returning();

    if (!inserted) throw new NotFoundException('Visa not found after insert');
    return this.mapVisaResponse(inserted);
  }

  async updateVisa(
    userId: string,
    nationalityId: string,
    id: string,
    dto: UpdateVisaDto,
  ): Promise<VisaResponseDto> {
    // No OMITTED re-check: a visa can exist on a nationality whose passport was later cleared.
    // The visa record is valid and editable regardless of current passport status.
    await this.requireNationality(userId, nationalityId);
    const existing = await this.db.query.userVisas.findFirst({
      where: and(eq(userVisas.id, id), eq(userVisas.nationalityId, nationalityId)),
    });
    if (!existing) throw new NotFoundException('Visa not found');

    const patch: Partial<typeof userVisas.$inferInsert> = {};
    if (dto.visaType !== undefined) patch.visaType = dto.visaType;
    if (dto.entries !== undefined) patch.entries = dto.entries;
    if (dto.expiryDate !== undefined) {
      patch.expiryDate = dto.expiryDate;
      patch.visaStatus = computeDocumentStatus(dto.expiryDate);
    }
    if (dto.notes !== undefined) patch.notes = dto.notes ?? null;

    if (Object.keys(patch).length === 0) return this.mapVisaResponse(existing);

    const [updated] = await this.db
      .update(userVisas)
      .set(patch)
      .where(and(eq(userVisas.id, id), eq(userVisas.nationalityId, nationalityId)))
      .returning();

    if (!updated) throw new NotFoundException('Visa not found');
    return this.mapVisaResponse(updated);
  }

  async deleteVisa(userId: string, nationalityId: string, id: string): Promise<void> {
    await this.requireNationality(userId, nationalityId);
    const existing = await this.db.query.userVisas.findFirst({
      where: and(eq(userVisas.id, id), eq(userVisas.nationalityId, nationalityId)),
    });
    if (!existing) throw new NotFoundException('Visa not found');
    await this.db
      .delete(userVisas)
      .where(and(eq(userVisas.id, id), eq(userVisas.nationalityId, nationalityId)));
  }

  // ---------------------------------------------------------------------------
  // ETAs
  // ---------------------------------------------------------------------------

  async getEtas(userId: string, nationalityId: string): Promise<EtaResponseDto[]> {
    await this.requireNationality(userId, nationalityId);
    const records = await this.db.query.userEtas.findMany({
      where: eq(userEtas.userNationalityId, nationalityId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return records.map((r) => this.mapEtaResponse(r));
  }

  async addEta(userId: string, nationalityId: string, dto: CreateEtaDto): Promise<EtaResponseDto> {
    const nationality = await this.requireNationality(userId, nationalityId);
    if (nationality.passportStatus === PassportStatus.OMITTED) {
      throw new BadRequestException('Cannot add ETAs to a nationality without passport data');
    }

    const [inserted] = await this.db
      .insert(userEtas)
      .values({
        userNationalityId: nationalityId,
        passportNumber: nationality.passportNumber!,
        destinationCountry: dto.destinationCountry,
        authorizationNumber: dto.authorizationNumber,
        etaType: dto.etaType,
        entries: dto.entries,
        expiryDate: dto.expiryDate,
        etaStatus: computeDocumentStatus(dto.expiryDate),
        notes: dto.notes ?? null,
      })
      .returning();

    if (!inserted) throw new NotFoundException('ETA not found after insert');
    return this.mapEtaResponse(inserted);
  }

  async updateEta(
    userId: string,
    nationalityId: string,
    id: string,
    dto: UpdateEtaDto,
  ): Promise<EtaResponseDto> {
    await this.requireNationality(userId, nationalityId);
    const existing = await this.db.query.userEtas.findFirst({
      where: and(eq(userEtas.id, id), eq(userEtas.userNationalityId, nationalityId)),
    });
    if (!existing) throw new NotFoundException('ETA not found');

    const patch: Partial<typeof userEtas.$inferInsert> = {};
    if (dto.authorizationNumber !== undefined) patch.authorizationNumber = dto.authorizationNumber;
    if (dto.etaType !== undefined) patch.etaType = dto.etaType;
    if (dto.entries !== undefined) patch.entries = dto.entries;
    if (dto.expiryDate !== undefined) {
      patch.expiryDate = dto.expiryDate;
      patch.etaStatus = computeDocumentStatus(dto.expiryDate);
    }
    if (dto.notes !== undefined) patch.notes = dto.notes ?? null;

    if (Object.keys(patch).length === 0) return this.mapEtaResponse(existing);

    const [updated] = await this.db
      .update(userEtas)
      .set(patch)
      .where(and(eq(userEtas.id, id), eq(userEtas.userNationalityId, nationalityId)))
      .returning();

    if (!updated) throw new NotFoundException('ETA not found');
    return this.mapEtaResponse(updated);
  }

  async deleteEta(userId: string, nationalityId: string, id: string): Promise<void> {
    await this.requireNationality(userId, nationalityId);
    const existing = await this.db.query.userEtas.findFirst({
      where: and(eq(userEtas.id, id), eq(userEtas.userNationalityId, nationalityId)),
    });
    if (!existing) throw new NotFoundException('ETA not found');
    await this.db
      .delete(userEtas)
      .where(and(eq(userEtas.id, id), eq(userEtas.userNationalityId, nationalityId)));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async requireNationality(
    userId: string,
    nationalityId: string,
  ): Promise<typeof userNationalities.$inferSelect> {
    const nationality = await this.db.query.userNationalities.findFirst({
      where: and(eq(userNationalities.id, nationalityId), eq(userNationalities.userId, userId)),
    });
    if (!nationality) throw new NotFoundException('Nationality not found');
    return nationality;
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

  private mapVisaResponse(r: typeof userVisas.$inferSelect): VisaResponseDto {
    return {
      id: r.id,
      nationalityId: r.nationalityId,
      coverageType: r.coverageType,
      countryCode: r.countryCode ?? null,
      visaZone: r.visaZone ?? null,
      visaType: r.visaType,
      entries: r.entries,
      expiryDate: r.expiryDate,
      visaStatus: DocumentStatus[r.visaStatus],
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private mapEtaResponse(r: typeof userEtas.$inferSelect): EtaResponseDto {
    return {
      id: r.id,
      userNationalityId: r.userNationalityId,
      passportNumber: r.passportNumber,
      destinationCountry: r.destinationCountry,
      authorizationNumber: r.authorizationNumber,
      etaType: r.etaType,
      entries: r.entries,
      expiryDate: r.expiryDate,
      etaStatus: DocumentStatus[r.etaStatus],
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
