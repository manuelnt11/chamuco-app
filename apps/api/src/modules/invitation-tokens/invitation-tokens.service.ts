import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import {
  GroupMemberStatus,
  GroupRole,
  InvitationTokenContext,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { ConfigService } from '@nestjs/config';
import { users } from '@/modules/users/schema/users.schema';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { trips } from '@/modules/trips/schema/trips.schema';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';
import { invitationTokens } from './schema/invitation-tokens.schema';
import { EmailService } from '@/modules/email/email.service';
import { EmailTemplate } from '@/modules/email/email-template.enum';
import type { CreateInvitationTokenDto } from './dto/create-invitation-token.dto';
import type { InvitationTokenCreateResponseDto } from './dto/invitation-token-create-response.dto';
import type { InvitationTokenResolveResponseDto } from './dto/invitation-token-resolve-response.dto';
import type { InvitationTokenRedeemResponseDto } from './dto/invitation-token-redeem-response.dto';

@Injectable()
export class InvitationTokensService {
  private readonly logger = new Logger(InvitationTokensService.name);
  private readonly frontendUrl: string;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly emailService: EmailService,
    cfg: ConfigService,
  ) {
    this.frontendUrl = cfg.get<string>('FRONTEND_URL')!;
  }

  async createToken(
    dto: CreateInvitationTokenDto,
    callerId: string,
  ): Promise<InvitationTokenCreateResponseDto> {
    await this.assertCreatePermission(dto, callerId);

    if (dto.recipientEmail) {
      const existing = await this.db.query.userProfiles.findFirst({
        where: eq(userProfiles.email, dto.recipientEmail),
        columns: { userId: true },
      });
      if (existing) {
        throw new ConflictException(
          'This email is already registered. Use the direct invitation flow instead.',
        );
      }
    }

    const token = randomBytes(32).toString('base64url');
    const url = `${this.frontendUrl}/join?token=${token}`;

    try {
      await this.db.insert(invitationTokens).values({
        token,
        createdBy: callerId,
        contextType: dto.contextType,
        contextId: dto.contextId ?? null,
        recipientEmail: dto.recipientEmail ?? null,
        isActive: true,
        note: dto.note ?? null,
      });
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code === '23505') {
        throw new ConflictException(
          'An open invitation link already exists for this context. Toggle it instead of creating a new one.',
        );
      }
      throw err;
    }

    if (dto.recipientEmail) {
      const contextName = await this.resolveContextName(dto.contextType, dto.contextId ?? null);
      const caller = await this.db.query.users.findFirst({
        where: eq(users.id, callerId),
        columns: { displayName: true },
      });

      const subject = `${caller?.displayName ?? 'Alguien'} te invita a unirse a Chamuco`;
      this.emailService
        .sendMail({
          to: dto.recipientEmail,
          subject,
          template: EmailTemplate.APP_INVITATION,
          context: {
            title: subject,
            inviterDisplayName: caller?.displayName ?? '',
            contextName,
            note: dto.note ?? null,
            ctaUrl: url,
          },
        })
        .catch((err: unknown) => {
          this.logger.error('Failed to send app-invitation email', err);
        });
    }

    return { token, url, isActive: true };
  }

  async findOpenToken(
    contextType: InvitationTokenContext,
    contextId: string | null,
    callerId: string,
  ): Promise<InvitationTokenCreateResponseDto | null> {
    await this.assertCreatePermission({ contextType, contextId: contextId ?? undefined }, callerId);

    const row = await this.db.query.invitationTokens.findFirst({
      where: and(
        eq(invitationTokens.contextType, contextType),
        contextId ? eq(invitationTokens.contextId, contextId) : isNull(invitationTokens.contextId),
        isNull(invitationTokens.recipientEmail),
        // For referral, multiple users can have tokens — return only the caller's
        ...(contextType === InvitationTokenContext.REFERRAL
          ? [eq(invitationTokens.createdBy, callerId)]
          : []),
      ),
      orderBy: [desc(invitationTokens.createdAt)],
    });

    if (!row) return null;

    return {
      token: row.token,
      url: `${this.frontendUrl}/join?token=${row.token}`,
      isActive: row.isActive,
    };
  }

  async resolveToken(token: string): Promise<InvitationTokenResolveResponseDto> {
    const row = await this.db.query.invitationTokens.findFirst({
      where: eq(invitationTokens.token, token),
    });
    if (!row) throw new NotFoundException('Invitation token not found');

    const creator = await this.db.query.users.findFirst({
      where: eq(users.id, row.createdBy),
      columns: { displayName: true, username: true },
    });
    if (!creator) throw new NotFoundException('Token creator not found');

    const contextName = await this.resolveContextName(row.contextType, row.contextId ?? null);

    return {
      token: row.token,
      contextType: row.contextType,
      contextId: row.contextId ?? null,
      contextName,
      createdByDisplayName: creator.displayName,
      createdByUsername: creator.username,
      note: row.note ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async redeemToken(token: string, userId: string): Promise<InvitationTokenRedeemResponseDto> {
    const row = await this.db.query.invitationTokens.findFirst({
      where: eq(invitationTokens.token, token),
    });
    if (!row) throw new NotFoundException('Invitation token not found');

    if (!row.isActive) {
      throw new ConflictException('This invitation link has been deactivated.');
    }

    if (row.recipientEmail) {
      const alreadyRedeemed = (row.redeemers ?? []).length > 0;
      if (alreadyRedeemed) {
        throw new ConflictException('This invitation link has already been used.');
      }
    }

    // Drizzle PgTransaction is structurally compatible with DrizzleClient for DML operations
    const outcome = await this.db.transaction(async (tx) => {
      const db = tx as unknown as DrizzleClient;
      const redemptionOutcome = await this.processRedemption(row, userId, db);
      await db
        .update(invitationTokens)
        .set({
          redeemers: sql`${invitationTokens.redeemers} || ${JSON.stringify([{ who: userId, at: new Date().toISOString() }])}::jsonb`,
        })
        .where(eq(invitationTokens.token, token));
      return redemptionOutcome;
    });

    return {
      outcome,
      contextType: row.contextType,
      contextId: row.contextId ?? null,
    };
  }

  async toggleToken(token: string, callerId: string): Promise<void> {
    const row = await this.db.query.invitationTokens.findFirst({
      where: eq(invitationTokens.token, token),
    });
    if (!row) throw new NotFoundException('Invitation token not found');

    if (row.recipientEmail) {
      throw new BadRequestException('Targeted invitation links cannot be toggled.');
    }

    if (row.createdBy !== callerId) {
      await this.assertCreatePermission(
        { contextType: row.contextType, contextId: row.contextId ?? undefined },
        callerId,
      );
    }

    await this.db
      .update(invitationTokens)
      .set({ isActive: !row.isActive })
      .where(eq(invitationTokens.token, token));
  }

  private async processRedemption(
    row: typeof invitationTokens.$inferSelect,
    userId: string,
    db: DrizzleClient,
  ): Promise<InvitationTokenRedeemResponseDto['outcome']> {
    if (row.contextType === InvitationTokenContext.REFERRAL) {
      return 'REFERRAL_RECORDED';
    }

    if (row.contextType === InvitationTokenContext.TRIP && row.contextId) {
      return this.redeemTripToken(row.contextId, userId, row.createdBy, db);
    }

    if (row.contextType === InvitationTokenContext.GROUP && row.contextId) {
      return this.redeemGroupToken(row.contextId, userId, row.createdBy, db);
    }

    throw new BadRequestException('Invalid token context');
  }

  private async redeemTripToken(
    tripId: string,
    userId: string,
    initiatedBy: string,
    db: DrizzleClient,
  ): Promise<InvitationTokenRedeemResponseDto['outcome']> {
    const existing = await db.query.tripParticipants.findFirst({
      where: and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)),
    });

    if (existing?.status === TripParticipantStatus.CONFIRMED) return 'ALREADY_MEMBER';
    if (
      existing?.status === TripParticipantStatus.INVITED ||
      existing?.status === TripParticipantStatus.ACCEPTED
    ) {
      return 'ALREADY_INVITED';
    }

    if (existing?.status === TripParticipantStatus.PENDING_REQUEST) {
      await db
        .update(tripParticipants)
        .set({
          status: TripParticipantStatus.INVITED,
          decidedBy: initiatedBy,
          updatedAt: new Date(),
        })
        .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)));
      return 'REQUEST_ACCEPTED';
    }

    if (existing) {
      await db
        .update(tripParticipants)
        .set({
          status: TripParticipantStatus.INVITED,
          role: TripRole.PARTICIPANT,
          initiatedBy,
          decidedBy: null,
          updatedAt: new Date(),
        })
        .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.userId, userId)));
      return 'INVITED';
    }

    await db.insert(tripParticipants).values({
      tripId,
      userId,
      role: TripRole.PARTICIPANT,
      status: TripParticipantStatus.INVITED,
      isTraveler: true,
      initiatedBy,
    });
    return 'INVITED';
  }

  private async redeemGroupToken(
    groupId: string,
    userId: string,
    initiatedBy: string,
    db: DrizzleClient,
  ): Promise<InvitationTokenRedeemResponseDto['outcome']> {
    const existing = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (existing?.status === GroupMemberStatus.ACTIVE) return 'ALREADY_MEMBER';
    if (existing?.status === GroupMemberStatus.INVITED) return 'ALREADY_INVITED';

    if (existing?.status === GroupMemberStatus.REQUEST) {
      await db
        .update(groupMembers)
        .set({
          status: GroupMemberStatus.ACTIVE,
          decidedBy: initiatedBy,
          respondedAt: new Date(),
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
      return 'REQUEST_ACCEPTED';
    }

    if (existing) {
      await db
        .update(groupMembers)
        .set({
          status: GroupMemberStatus.INVITED,
          role: GroupRole.MEMBER,
          initiatedBy,
          initiatedAt: new Date(),
          respondedAt: null,
          decidedBy: null,
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    } else {
      await db.insert(groupMembers).values({
        groupId,
        userId,
        status: GroupMemberStatus.INVITED,
        role: GroupRole.MEMBER,
        initiatedBy,
      });
    }
    return 'INVITED';
  }

  private async assertCreatePermission(
    dto: Pick<CreateInvitationTokenDto, 'contextType' | 'contextId'>,
    callerId: string,
  ): Promise<void> {
    if (dto.contextType === InvitationTokenContext.REFERRAL) return;

    if (!dto.contextId) {
      throw new BadRequestException('contextId is required for trip and group invitation tokens');
    }

    if (dto.contextType === InvitationTokenContext.TRIP) {
      const participant = await this.db.query.tripParticipants.findFirst({
        where: and(
          eq(tripParticipants.tripId, dto.contextId),
          eq(tripParticipants.userId, callerId),
          eq(tripParticipants.status, TripParticipantStatus.CONFIRMED),
        ),
        columns: { role: true },
      });
      if (
        !participant ||
        (participant.role !== TripRole.ORGANIZER && participant.role !== TripRole.CO_ORGANIZER)
      ) {
        throw new ForbiddenException('Only trip organizers can create invitation tokens.');
      }
    }

    if (dto.contextType === InvitationTokenContext.GROUP) {
      const member = await this.db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, dto.contextId),
          eq(groupMembers.userId, callerId),
          eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        ),
        columns: { role: true },
      });
      if (!member || (member.role !== GroupRole.OWNER && member.role !== GroupRole.ADMIN)) {
        throw new ForbiddenException('Only group admins can create invitation tokens.');
      }
    }
  }

  private async resolveContextName(
    contextType: InvitationTokenContext,
    contextId: string | null,
  ): Promise<string | null> {
    if (!contextId) return null;

    if (contextType === InvitationTokenContext.TRIP) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, contextId),
        columns: { name: true },
      });
      return trip?.name ?? null;
    }

    if (contextType === InvitationTokenContext.GROUP) {
      const group = await this.db.query.groups.findFirst({
        where: and(eq(groups.id, contextId), isNull(groups.deletedAt)),
        columns: { name: true },
      });
      return group?.name ?? null;
    }

    return null;
  }
}
