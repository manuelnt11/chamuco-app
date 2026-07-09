import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import {
  GROUP_ADMIN_ROLES,
  GroupMemberStatus,
  GroupRole,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { groupMemberStats } from '@/modules/groups/schema/group-member-stats.schema';
import { groups } from '@/modules/groups/schema/groups.schema';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { GroupMembersService } from '@/modules/groups/members/group-members.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type {
  BulkInvitationResponseDto,
  InvitationResultDto,
} from './dto/bulk-invitation-response.dto';

@Injectable()
export class GroupInvitationsService {
  private readonly logger = new Logger(GroupInvitationsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly groupMembersService: GroupMembersService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendInvitations(
    groupId: string,
    dto: CreateInvitationDto,
    adminUserId: string,
  ): Promise<BulkInvitationResponseDto> {
    await this.groupMembersService.assertGroupAdmin(groupId, adminUserId);

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });

    const targetUsers = await this.db.query.users.findMany({
      where: inArray(users.username, dto.usernames),
    });
    const userByUsername = new Map(targetUsers.map((u) => [u.username, u]));

    const existingMemberships =
      targetUsers.length > 0
        ? await this.db.query.groupMembers.findMany({
            where: and(
              eq(groupMembers.groupId, groupId),
              inArray(
                groupMembers.userId,
                targetUsers.map((u) => u.id),
              ),
            ),
          })
        : [];
    const membershipByUserId = new Map(existingMemberships.map((m) => [m.userId, m]));

    const results: InvitationResultDto[] = [];
    const invitedUserIds: string[] = [];

    for (const username of dto.usernames) {
      const targetUser = userByUsername.get(username);

      if (!targetUser) {
        results.push({ username, status: 'NOT_FOUND' });
        continue;
      }

      const existing = membershipByUserId.get(targetUser.id);

      if (existing) {
        if (existing.status === GroupMemberStatus.ACTIVE) {
          results.push({ username, status: 'ALREADY_MEMBER' });
          continue;
        }
        if (existing.status === GroupMemberStatus.INVITED) {
          results.push({ username, status: 'ALREADY_INVITED' });
          continue;
        }
        if (existing.status === GroupMemberStatus.REQUEST) {
          results.push({ username, status: 'HAS_PENDING_REQUEST' });
          continue;
        }
        // REJECTED / REMOVED / LEFT — re-invite, reset to MEMBER role
        await this.db
          .update(groupMembers)
          .set({
            status: GroupMemberStatus.INVITED,
            role: GroupRole.MEMBER,
            initiatedBy: adminUserId,
            initiatedAt: new Date(),
            respondedAt: null,
            decidedBy: null,
          })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUser.id)));
      } else {
        await this.db.insert(groupMembers).values({
          groupId,
          userId: targetUser.id,
          status: GroupMemberStatus.INVITED,
          role: GroupRole.MEMBER,
          initiatedBy: adminUserId,
        });
      }

      invitedUserIds.push(targetUser.id);
      results.push({ username, status: 'INVITED' });
    }

    if (invitedUserIds.length > 0) {
      await this.notifications
        .notifyMany(
          invitedUserIds,
          NotificationType.GROUP_INVITATION,
          { groupId, groupName: group?.name ?? '' },
          [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        )
        .catch((err: unknown) => {
          this.logger.error('Failed to send GROUP_INVITATION notifications', err);
        });
    }

    return { results };
  }

  async acceptInvitation(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, requestingUserId);

    if (membership.status !== GroupMemberStatus.INVITED) {
      throw new ConflictException('No pending invitation found');
    }

    const now = new Date();
    await this.db.transaction(async (trx) => {
      await trx
        .update(groupMembers)
        .set({ status: GroupMemberStatus.ACTIVE, respondedAt: now, decidedBy: requestingUserId })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));

      await trx
        .insert(groupMemberStats)
        .values({ groupId, userId: requestingUserId, joinedAt: now })
        .onConflictDoNothing();
    });

    const [group, acceptingUser, adminMembers] = await Promise.all([
      this.db.query.groups.findFirst({ where: eq(groups.id, groupId), columns: { name: true } }),
      this.db.query.users.findFirst({
        where: eq(users.id, requestingUserId),
        columns: { username: true },
      }),
      this.db.query.groupMembers.findMany({
        where: and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, GroupMemberStatus.ACTIVE),
          inArray(groupMembers.role, GROUP_ADMIN_ROLES),
        ),
        columns: { userId: true },
      }),
    ]);

    const adminIds = adminMembers.map((m) => m.userId);
    if (adminIds.length > 0) {
      await this.notifications
        .notifyMany(
          adminIds,
          NotificationType.GROUP_INVITATION_ACCEPTED,
          { groupId, groupName: group?.name ?? '', username: acceptingUser?.username ?? '' },
          [NotificationChannel.PUSH],
        )
        .catch((err: unknown) => {
          this.logger.error('Failed to send GROUP_INVITATION_ACCEPTED notification', err);
        });
    }
  }

  async declineInvitation(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, requestingUserId);

    if (membership.status !== GroupMemberStatus.INVITED) {
      throw new ConflictException('No pending invitation found');
    }

    await this.db
      .update(groupMembers)
      .set({
        status: GroupMemberStatus.REJECTED,
        respondedAt: new Date(),
        decidedBy: requestingUserId,
      })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));
  }

  async revokeInvitation(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
  ): Promise<void> {
    await this.groupMembersService.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, targetUserId);

    if (membership.status !== GroupMemberStatus.INVITED) {
      throw new ConflictException('No pending invitation to revoke');
    }

    await this.db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
  }
}
