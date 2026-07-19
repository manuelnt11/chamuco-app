import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

import {
  ExportField,
  ExportFormat,
  NotificationChannel,
  NotificationType,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { userNationalities } from '@/modules/users/schema/user-nationalities.schema';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import type { EmergencyContactDto } from '@/modules/users/emergency-contacts/dto/emergency-contact.dto';
import type { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import type { ParticipantResponseDto } from './dto/participant-response.dto';
import type { PendingParticipantResponseDto } from './dto/pending-participant-response.dto';
import type { MyParticipationResponseDto } from './dto/my-participation-response.dto';
import type { MyTripInvitationResponseDto } from './dto/my-trip-invitation-response.dto';
import { ACTIVE_STATUSES, ORGANIZER_ROLES } from './trip-participants.constants';

const EXPORT_COLUMN_META: Record<ExportField, { header: string; width: number }> = {
  [ExportField.DISPLAY_NAME]: { header: 'Display name', width: 22 },
  [ExportField.USERNAME]: { header: 'Username', width: 18 },
  [ExportField.FIRST_NAME]: { header: 'First name', width: 18 },
  [ExportField.LAST_NAME]: { header: 'Last name', width: 18 },
  [ExportField.EMAIL]: { header: 'Email', width: 28 },
  [ExportField.PHONE]: { header: 'Phone', width: 20 },
  [ExportField.DATE_OF_BIRTH]: { header: 'Date of birth', width: 15 },
  [ExportField.HOME_COUNTRY]: { header: 'Home country', width: 14 },
  [ExportField.HOME_CITY]: { header: 'Home city', width: 18 },
  [ExportField.NATIONALITY]: { header: 'Nationality', width: 14 },
  [ExportField.NATIONAL_ID_NUMBER]: { header: 'National ID', width: 18 },
  [ExportField.PASSPORT_NUMBER]: { header: 'Passport number', width: 18 },
  [ExportField.PASSPORT_EXPIRY]: { header: 'Passport expiry', width: 16 },
  [ExportField.BLOOD_TYPE]: { header: 'Blood type', width: 12 },
  [ExportField.DIETARY_PREFERENCE]: { header: 'Dietary preference', width: 20 },
  [ExportField.DIETARY_NOTES]: { header: 'Dietary notes', width: 25 },
  [ExportField.MEDICAL_NOTES]: { header: 'Medical notes', width: 25 },
  [ExportField.EMERGENCY_CONTACT]: { header: 'Emergency contact', width: 35 },
  [ExportField.ROLE]: { header: 'Role', width: 14 },
  [ExportField.STATUS]: { header: 'Status', width: 12 },
  [ExportField.CONFIRMED_AT]: { header: 'Confirmed at', width: 20 },
  [ExportField.IS_TRAVELER]: { header: 'Traveler', width: 10 },
};

interface ExportLangBundle {
  headers: Partial<Record<ExportField, string>>;
  role: Record<string, string>;
  status: Record<string, string>;
  dietaryPreference: Record<string, string>;
  bloodType: Record<string, string>;
  yesNo: [string, string];
}

const EXPORT_TRANSLATIONS: Record<string, ExportLangBundle> = {
  en: {
    headers: {},
    role: { ORGANIZER: 'Organizer', CO_ORGANIZER: 'Co-organizer', PARTICIPANT: 'Participant' },
    status: { ACCEPTED: 'Accepted', CONFIRMED: 'Confirmed' },
    dietaryPreference: {
      OMNIVORE: 'Omnivore',
      VEGETARIAN: 'Vegetarian',
      VEGAN: 'Vegan',
      PESCATARIAN: 'Pescatarian',
      GLUTEN_FREE: 'Gluten-free',
      OTHER: 'Other',
    },
    bloodType: {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
    },
    yesNo: ['Yes', 'No'],
  },
  es: {
    headers: {
      [ExportField.DISPLAY_NAME]: 'Nombre visible',
      [ExportField.USERNAME]: 'Usuario',
      [ExportField.FIRST_NAME]: 'Nombre',
      [ExportField.LAST_NAME]: 'Apellido',
      [ExportField.EMAIL]: 'Correo electrónico',
      [ExportField.PHONE]: 'Teléfono',
      [ExportField.DATE_OF_BIRTH]: 'Fecha de nacimiento',
      [ExportField.HOME_COUNTRY]: 'País de residencia',
      [ExportField.HOME_CITY]: 'Ciudad de residencia',
      [ExportField.NATIONALITY]: 'Nacionalidad',
      [ExportField.NATIONAL_ID_NUMBER]: 'Número de documento',
      [ExportField.PASSPORT_NUMBER]: 'Número de pasaporte',
      [ExportField.PASSPORT_EXPIRY]: 'Vencimiento del pasaporte',
      [ExportField.BLOOD_TYPE]: 'Tipo de sangre',
      [ExportField.DIETARY_PREFERENCE]: 'Preferencia alimentaria',
      [ExportField.DIETARY_NOTES]: 'Notas alimentarias',
      [ExportField.MEDICAL_NOTES]: 'Notas médicas',
      [ExportField.EMERGENCY_CONTACT]: 'Contacto de emergencia',
      [ExportField.ROLE]: 'Rol',
      [ExportField.STATUS]: 'Estado',
      [ExportField.CONFIRMED_AT]: 'Confirmado el',
      [ExportField.IS_TRAVELER]: 'Viajero',
    },
    role: { ORGANIZER: 'Organizador', CO_ORGANIZER: 'Co-organizador', PARTICIPANT: 'Participante' },
    status: { ACCEPTED: 'Aceptado', CONFIRMED: 'Confirmado' },
    dietaryPreference: {
      OMNIVORE: 'Omnívoro',
      VEGETARIAN: 'Vegetariano',
      VEGAN: 'Vegano',
      PESCATARIAN: 'Pescetariano',
      GLUTEN_FREE: 'Sin gluten',
      OTHER: 'Otro',
    },
    bloodType: {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
    },
    yesNo: ['Sí', 'No'],
  },
};

type ParticipantExportRow = Record<ExportField, string>;

export const ALL_EXPORT_FIELDS = Object.values(ExportField) as ExportField[];

@Injectable()
export class TripParticipantsService {
  private readonly logger = new Logger(TripParticipantsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Remove / Leave ───────────────────────────────────────────────────────────

  async removeParticipant(
    tripId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    await this.assertTripExists(tripId);

    const targetParticipation = await this.findParticipantOrThrow(tripId, targetUserId);

    if (requestingUserId === targetUserId) {
      // Self: withdraw pending or cancel active participation
      if (
        targetParticipation.status === TripParticipantStatus.INVITED ||
        targetParticipation.status === TripParticipantStatus.PENDING_REQUEST
      ) {
        await this.db
          .delete(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        return;
      }

      if (
        ACTIVE_STATUSES.includes(targetParticipation.status as (typeof ACTIVE_STATUSES)[number])
      ) {
        await this.assertNotSoleOrganizer(tripId, targetUserId);
        await this.db
          .delete(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        return;
      }

      throw new ConflictException('No active participation to leave');
    }

    // Organizer removing another participant
    const requesterParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, requestingUserId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
        inArray(tripParticipants.role, ORGANIZER_ROLES),
      ),
    });

    if (!requesterParticipation) {
      throw new ForbiddenException('Only trip organizers can remove participants');
    }

    if (!ACTIVE_STATUSES.includes(targetParticipation.status as (typeof ACTIVE_STATUSES)[number])) {
      throw new ConflictException('Target user is not an active participant');
    }

    // Only ORGANIZER can remove another ORGANIZER
    if (
      targetParticipation.role === TripRole.ORGANIZER &&
      requesterParticipation.role !== TripRole.ORGANIZER
    ) {
      throw new ForbiddenException('Only the trip organizer can remove another organizer');
    }

    await this.assertNotSoleOrganizer(tripId, targetUserId);

    await this.db
      .delete(tripParticipants)
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.TRIP_PARTICIPANT_REMOVED,
        { tripId, tripName: trip?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_PARTICIPANT_REMOVED notification', err);
      });
  }

  // ─── Role management ──────────────────────────────────────────────────────────

  async updateParticipantRole(
    tripId: string,
    targetUserId: string,
    dto: UpdateParticipantRoleDto,
    requestingUserId: string,
  ): Promise<void> {
    const requesterParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, requestingUserId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
        eq(tripParticipants.role, TripRole.ORGANIZER),
      ),
    });

    if (!requesterParticipation) {
      throw new ForbiddenException('Only the trip organizer can update participant roles');
    }

    const targetParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, targetUserId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
    });
    if (!targetParticipation) throw new NotFoundException('Active participant not found');

    if (targetUserId === requestingUserId) {
      throw new ConflictException('Cannot update your own role');
    }

    if (dto.role === TripRole.ORGANIZER) {
      if (targetParticipation.role === TripRole.ORGANIZER) {
        throw new ConflictException('Target is already the trip organizer');
      }
      // Transfer ownership: current ORGANIZER becomes CO_ORGANIZER
      await this.db.transaction(async (trx) => {
        await trx
          .update(tripParticipants)
          .set({ role: TripRole.ORGANIZER, updatedAt: new Date() })
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)),
          );
        await trx
          .update(tripParticipants)
          .set({ role: TripRole.CO_ORGANIZER, updatedAt: new Date() })
          .where(
            and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, requestingUserId)),
          );
      });
      return;
    }

    await this.assertNotSoleOrganizer(tripId, targetUserId);

    await this.db
      .update(tripParticipants)
      .set({ role: dto.role, updatedAt: new Date() })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.TRIP_ROLE_CHANGED,
        { tripId, tripName: trip?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send TRIP_ROLE_CHANGED notification', err);
      });
  }

  // ─── Confirmation toggle ──────────────────────────────────────────────────────

  async toggleParticipantConfirmation(
    tripId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    await this.assertTripOrganizer(tripId, requestingUserId);

    const targetParticipation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, targetUserId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
    });
    if (!targetParticipation) throw new NotFoundException('Active participant not found');
    if (targetParticipation.role === TripRole.ORGANIZER)
      throw new ForbiddenException('Cannot toggle confirmation for the trip organizer');

    const now = new Date();
    const isConfirmed = targetParticipation.status === TripParticipantStatus.CONFIRMED;
    await this.db
      .update(tripParticipants)
      .set({
        status: isConfirmed ? TripParticipantStatus.ACCEPTED : TripParticipantStatus.CONFIRMED,
        confirmedAt: isConfirmed ? null : now,
        updatedAt: now,
      })
      .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, targetUserId)));
  }

  // ─── My participation ─────────────────────────────────────────────────────────

  async getMyParticipation(tripId: string, userId: string): Promise<MyParticipationResponseDto> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
    });

    if (!participation) throw new NotFoundException('Participation record not found');

    return {
      status: participation.status as TripParticipantStatus,
      role: participation.role as TripRole,
      isTraveler: participation.isTraveler,
    };
  }

  async listMyInvitations(userId: string): Promise<MyTripInvitationResponseDto[]> {
    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, TripParticipantStatus.INVITED),
      ),
    });

    if (rows.length === 0) return [];

    const tripIds = rows.map((r) => r.tripId);
    const tripRows = await this.db.query.trips.findMany({
      where: inArray(trips.id, tripIds),
    });

    const coverIds = tripRows.map((t) => t.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));
    const tripMap = new Map(tripRows.map((t) => [t.id, t]));

    return Promise.all(
      rows
        .filter((r) => tripMap.has(r.tripId))
        .map(async (participation) => {
          const trip = tripMap.get(participation.tripId)!;
          const coverRow = trip.cover ? (assetMap.get(trip.cover) ?? null) : null;
          const resolvedCover = coverRow
            ? await this.assetResolver.resolve(assetRowToAsset(coverRow))
            : null;

          return {
            trip: { id: trip.id, name: trip.name, coverUrl: resolvedCover?.url ?? null },
            initiatedAt: participation.initiatedAt.toISOString(),
          };
        }),
    );
  }

  // ─── List endpoints ───────────────────────────────────────────────────────────

  async listActiveParticipants(
    tripId: string,
    requestingUserId: string,
  ): Promise<ParticipantResponseDto[]> {
    await this.assertActiveParticipant(tripId, requestingUserId);

    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((participation) => {
      const user = userMap.get(participation.userId);
      if (!user) throw new NotFoundException(`User ${participation.userId} not found`);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        role: participation.role as TripRole,
        isTraveler: participation.isTraveler,
        status: participation.status as
          TripParticipantStatus.ACCEPTED | TripParticipantStatus.CONFIRMED,
        confirmedAt: participation.confirmedAt?.toISOString() ?? null,
      };
    });
  }

  async listPendingParticipants(
    tripId: string,
    requestingUserId: string,
  ): Promise<PendingParticipantResponseDto[]> {
    await this.assertTripOrganizer(tripId, requestingUserId);

    const rows = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        inArray(tripParticipants.status, [
          TripParticipantStatus.INVITED,
          TripParticipantStatus.PENDING_REQUEST,
        ]),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((participation) => {
      const user = userMap.get(participation.userId);
      if (!user) throw new NotFoundException(`User ${participation.userId} not found`);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        status: participation.status as
          TripParticipantStatus.INVITED | TripParticipantStatus.PENDING_REQUEST,
        initiatedAt: participation.initiatedAt.toISOString(),
      };
    });
  }

  // ─── Shared helpers (public — used by TripInvitationsService / TripJoinRequestsService) ──

  async findParticipantOrThrow(
    tripId: string,
    userId: string,
  ): Promise<typeof tripParticipants.$inferSelect> {
    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
    });
    if (!participation) throw new NotFoundException('Participation record not found');
    return participation;
  }

  async assertTripExists(tripId: string): Promise<typeof trips.$inferSelect> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async assertTripOrganizer(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
        inArray(tripParticipants.role, ORGANIZER_ROLES),
      ),
    });
    if (!participation)
      throw new ForbiddenException('Only trip organizers can perform this action');
  }

  private async assertActiveParticipant(tripId: string, userId: string): Promise<void> {
    await this.assertTripExists(tripId);

    const participation = await this.db.query.tripParticipants.findFirst({
      where: and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
      ),
    });
    if (!participation)
      throw new ForbiddenException('Only active trip participants can perform this action');
  }

  private async assertNotSoleOrganizer(tripId: string, userId: string): Promise<void> {
    const activeOrganizers = await this.db.query.tripParticipants.findMany({
      where: and(
        eq(tripParticipants.tripId, tripId),
        inArray(tripParticipants.status, ACTIVE_STATUSES),
        eq(tripParticipants.role, TripRole.ORGANIZER),
      ),
      limit: 2,
    });

    if (activeOrganizers.length === 1 && activeOrganizers[0]?.userId === userId) {
      throw new ConflictException(
        'Cannot remove or demote the last organizer. Transfer the role first.',
      );
    }
  }

  // Language detection pattern for export endpoints
  // ─────────────────────────────────────────────
  // Always read the language from the requesting user's DB preferences
  // (user_preferences.language), NOT from a query param.
  //
  // Rationale: the organizer is both caller and intended recipient of the file,
  // so their configured app language is the correct default. A query param would
  // duplicate info already in the DB and shift responsibility to the client.
  //
  // Future endpoint authors: follow this pattern. If an explicit override is ever
  // needed (e.g. exporting on behalf of someone else), add ?lang= as an OPTIONAL
  // override on top of the DB default — never replace the DB lookup entirely.
  async exportParticipants(
    tripId: string,
    requestingUserId: string,
    format: ExportFormat = ExportFormat.CSV,
    fields: ExportField[] = ALL_EXPORT_FIELDS,
  ): Promise<Buffer> {
    await this.assertTripOrganizer(tripId, requestingUserId);

    // Fetch language prefs and participation list in parallel — both are independent of each other.
    const [prefs, participationRows] = await Promise.all([
      this.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, requestingUserId),
        columns: { language: true },
      }),
      this.db.query.tripParticipants.findMany({
        where: and(
          eq(tripParticipants.tripId, tripId),
          inArray(tripParticipants.status, ACTIVE_STATUSES),
        ),
      }),
    ]);
    const lang = (prefs?.language ?? 'EN').toLowerCase();

    const userIds = participationRows.map((r) => r.userId);

    const [userRows, profileRows, nationalityRows] = await Promise.all([
      userIds.length > 0
        ? this.db.query.users.findMany({ where: inArray(users.id, userIds) })
        : Promise.resolve([]),
      userIds.length > 0
        ? this.db.query.userProfiles.findMany({ where: inArray(userProfiles.userId, userIds) })
        : Promise.resolve([]),
      userIds.length > 0
        ? this.db.query.userNationalities.findMany({
            where: and(
              inArray(userNationalities.userId, userIds),
              eq(userNationalities.isPrimary, true),
            ),
          })
        : Promise.resolve([]),
    ]);

    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const profileMap = new Map(profileRows.map((p) => [p.userId, p]));
    const nationalityMap = new Map(nationalityRows.map((n) => [n.userId, n]));

    const t = EXPORT_TRANSLATIONS[lang] ?? EXPORT_TRANSLATIONS['en']!;

    // Respect canonical field order; only include requested fields
    const fieldSet = new Set(fields);
    const activeFields = ALL_EXPORT_FIELDS.filter((f) => fieldSet.has(f));
    const columns = activeFields.map((f) => ({
      key: f,
      header: t.headers[f] ?? EXPORT_COLUMN_META[f].header,
      width: EXPORT_COLUMN_META[f].width,
    }));

    const [yes, no] = t.yesNo;

    const dataRows: ParticipantExportRow[] = participationRows
      .map((participation) => {
        const user = userMap.get(participation.userId);
        if (!user) return null;

        const profile = profileMap.get(participation.userId);
        const nat = nationalityMap.get(participation.userId);

        // DB stores JSONB with snake_case keys; DateOfBirth interface uses camelCase (yearVisible).
        // year_visible here is intentionally snake_case — matches the raw JSONB from the DB.
        const dob = profile?.dateOfBirth as
          { day: number; month: number; year: number; year_visible: boolean } | null | undefined;
        const dobStr = dob ? `${dob.day}/${dob.month}/${dob.year_visible ? dob.year : '----'}` : '';
        const contacts = (profile?.emergencyContacts ?? []) as EmergencyContactDto[];
        const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];
        const emergencyContact = primary
          ? `${primary.fullName} (${primary.relationship}) ${primary.phoneCountryCode}${primary.phoneLocalNumber}`
          : '';

        return {
          [ExportField.DISPLAY_NAME]: user.displayName,
          [ExportField.USERNAME]: `@${user.username}`,
          [ExportField.FIRST_NAME]: profile?.firstName ?? '',
          [ExportField.LAST_NAME]: profile?.lastName ?? '',
          [ExportField.EMAIL]: profile?.email ?? '',
          [ExportField.PHONE]: profile
            ? `${profile.phoneCountryCode}${profile.phoneLocalNumber}`
            : '',
          [ExportField.DATE_OF_BIRTH]: dobStr,
          [ExportField.HOME_COUNTRY]: profile?.homeCountry ?? '',
          [ExportField.HOME_CITY]: profile?.homeCity ?? '',
          [ExportField.NATIONALITY]: nat?.countryCode ?? '',
          [ExportField.NATIONAL_ID_NUMBER]: nat?.nationalIdNumber ?? '',
          [ExportField.PASSPORT_NUMBER]: nat?.passportNumber ?? '',
          [ExportField.PASSPORT_EXPIRY]: nat?.passportExpiryDate ?? '',
          [ExportField.BLOOD_TYPE]:
            t.bloodType[profile?.bloodType ?? ''] ?? profile?.bloodType ?? '',
          [ExportField.DIETARY_PREFERENCE]:
            t.dietaryPreference[profile?.dietaryPreference ?? ''] ??
            profile?.dietaryPreference ??
            '',
          [ExportField.DIETARY_NOTES]: profile?.dietaryNotes ?? '',
          [ExportField.MEDICAL_NOTES]: profile?.generalMedicalNotes ?? '',
          [ExportField.EMERGENCY_CONTACT]: emergencyContact,
          [ExportField.ROLE]: t.role[participation.role] ?? participation.role,
          [ExportField.STATUS]: t.status[participation.status] ?? participation.status,
          [ExportField.CONFIRMED_AT]: participation.confirmedAt?.toISOString() ?? '',
          [ExportField.IS_TRAVELER]: participation.isTraveler ? yes : no,
        } as ParticipantExportRow;
      })
      .filter((r): r is ParticipantExportRow => r !== null);

    switch (format) {
      case ExportFormat.CSV:
        return this.buildCsvBuffer(dataRows, columns);
      case ExportFormat.ODS:
        return this.buildOdsBuffer(dataRows, columns);
      case ExportFormat.XLSX:
        return this.buildXlsxBuffer(dataRows, columns);
      default:
        throw new Error(`Unsupported export format: ${format as string}`);
    }
  }

  private async buildXlsxBuffer(
    dataRows: ParticipantExportRow[],
    columns: Array<{ key: ExportField; header: string; width: number }>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Participants');
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
    sheet.getRow(1).font = { bold: true };
    for (const row of dataRows) {
      sheet.addRow(row);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private buildCsvBuffer(
    dataRows: ParticipantExportRow[],
    columns: Array<{ key: ExportField; header: string }>,
  ): Buffer {
    const escape = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const headerLine = columns.map((c) => escape(c.header)).join(',');
    const lines = dataRows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
    return Buffer.from([headerLine, ...lines].join('\r\n'), 'utf-8');
  }

  private async buildOdsBuffer(
    dataRows: ParticipantExportRow[],
    columns: Array<{ key: ExportField; header: string }>,
  ): Promise<Buffer> {
    const x = (s: string): string =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const cell = (v: string): string =>
      `<table:table-cell office:value-type="string"><text:p>${x(v)}</text:p></table:table-cell>`;

    const headerRow = `<table:table-row>${columns.map((c) => cell(c.header)).join('')}</table:table-row>`;
    const dataRowsXml = dataRows
      .map(
        (row) =>
          `<table:table-row>${columns.map((c) => cell(row[c.key])).join('')}</table:table-row>`,
      )
      .join('');

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.3">
  <office:body><office:spreadsheet>
    <table:table table:name="Participants">
      ${headerRow}${dataRowsXml}
    </table:table>
  </office:spreadsheet></office:body>
</office:document-content>`;

    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    const zip = new JSZip();
    zip.file('mimetype', 'application/vnd.oasis.opendocument.spreadsheet', {
      compression: 'STORE',
    });
    zip.folder('META-INF')!.file('manifest.xml', manifestXml);
    zip.file('content.xml', contentXml);

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }) as Promise<Buffer>;
  }

  private async batchResolveAvatarUrls(
    userRows: Array<{ id: string; avatar: string | null }>,
  ): Promise<Map<string, string | null>> {
    const avatarIds = userRows.map((u) => u.avatar).filter((id): id is string => id !== null);

    const avatarAssets =
      avatarIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, avatarIds) })
        : [];

    const assetMap = new Map(avatarAssets.map((a) => [a.id, a]));

    const entries = await Promise.all(
      userRows.map(async (user): Promise<[string, string | null]> => {
        const asset = user.avatar ? (assetMap.get(user.avatar) ?? null) : null;
        if (!asset) return [user.id, null];

        const resolved = await this.assetResolver.resolve({
          id: asset.id,
          type: asset.type,
          source: asset.source,
          target: asset.target,
          fileSize: asset.fileSize ?? undefined,
          isPublic: asset.isPublic,
          createdAt: asset.createdAt.toISOString(),
        });

        return [user.id, resolved?.url ?? null];
      }),
    );

    return new Map(entries);
  }

  async assertCapacityAvailable(tripId: string): Promise<void> {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: { participantCapacity: true },
    });
    if (!trip) return;

    const [row] = await this.db
      .select({ total: count() })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          inArray(tripParticipants.status, [...ACTIVE_STATUSES]),
          eq(tripParticipants.isTraveler, true),
        ),
      );

    if ((row?.total ?? 0) >= trip.participantCapacity) {
      throw new ConflictException('Trip has reached maximum participant capacity');
    }
  }
}
