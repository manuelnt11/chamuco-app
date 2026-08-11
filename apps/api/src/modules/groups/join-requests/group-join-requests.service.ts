import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  GroupMemberStatus,
  GroupRole,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { groupMemberStats } from '@/modules/groups/schema/group-member-stats.schema';
import { groups } from '@/modules/groups/schema/groups.schema';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { GroupMembersService } from '@/modules/groups/members/group-members.service';
import type { MyGroupJoinRequestResponseDto } from './dto/my-group-join-request-response.dto';

@Injectable()
export class GroupJoinRequestsService {
  private readonly logger = new Logger(GroupJoinRequestsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly groupMembersService: GroupMembersService,
    private readonly notifications: NotificationsService,
    private readonly assetResolver: AssetResolverService,
  ) {}

  async listMyPendingRequests(userId: string): Promise<MyGroupJoinRequestResponseDto[]> {
    const memberships = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.REQUEST),
      ),
    });

    if (memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.groupId);
    const initiatedAtByGroupId = new Map(memberships.map((m) => [m.groupId, m.initiatedAt]));

    const groupRows = await this.db.query.groups.findMany({
      where: and(inArray(groups.id, groupIds), isNull(groups.deletedAt)),
    });

    if (groupRows.length === 0) return [];

    const coverIds = groupRows.map((g) => g.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));

    return Promise.all(
      groupRows.map(async (group) => {
        if (!group.cover) throw new NotFoundException('Group cover asset not found');
        const coverRow = assetMap.get(group.cover);
        if (!coverRow) throw new NotFoundException('Group cover asset not found');
        const resolvedCover = await this.assetResolver.resolve(assetRowToAsset(coverRow));
        if (!resolvedCover) throw new NotFoundException('Failed to resolve group cover');
        return {
          groupId: group.id,
          name: group.name,
          coverUrl: resolvedCover.url,
          visibility: group.visibility,
          initiatedAt: initiatedAtByGroupId.get(group.id)!.toISOString(),
        };
      }),
    );
  }

  async submitJoinRequest(groupId: string, requestingUserId: string): Promise<void> {
    const group = await this.groupMembersService.assertGroupExists(groupId);
    if (group.visibility !== 'PUBLIC') {
      throw new ConflictException('Join requests are only allowed for public groups');
    }

    const existing = await this.db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)),
    });

    if (existing) {
      if (
        existing.status === GroupMemberStatus.ACTIVE ||
        existing.status === GroupMemberStatus.REQUEST
      ) {
        throw new ConflictException('A pending request or active membership already exists');
      }
      // Re-request after REJECTED / REMOVED / LEFT — always reset to MEMBER role
      await this.db
        .update(groupMembers)
        .set({
          status: GroupMemberStatus.REQUEST,
          role: GroupRole.MEMBER,
          initiatedBy: requestingUserId,
          initiatedAt: new Date(),
          respondedAt: null,
          decidedBy: null,
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));
    } else {
      await this.db.insert(groupMembers).values({
        groupId,
        userId: requestingUserId,
        status: GroupMemberStatus.REQUEST,
        role: GroupRole.MEMBER,
        initiatedBy: requestingUserId,
      });
    }
  }

  async acceptJoinRequest(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
  ): Promise<void> {
    await this.groupMembersService.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, targetUserId);

    if (membership.status !== GroupMemberStatus.REQUEST) {
      throw new ConflictException('No pending join request found for this user');
    }

    const now = new Date();
    await this.db.transaction(async (trx) => {
      await trx
        .update(groupMembers)
        .set({ status: GroupMemberStatus.ACTIVE, respondedAt: now, decidedBy: adminUserId })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

      await trx
        .insert(groupMemberStats)
        .values({ groupId, userId: targetUserId, joinedAt: now })
        .onConflictDoNothing();
    });

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.GROUP_JOIN_ACCEPTED,
        { groupId, groupName: group?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send GROUP_JOIN_ACCEPTED notification', err);
      });
  }

  async rejectJoinRequest(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
  ): Promise<void> {
    await this.groupMembersService.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, targetUserId);

    if (membership.status !== GroupMemberStatus.REQUEST) {
      throw new ConflictException('No pending join request found for this user');
    }

    await this.db
      .update(groupMembers)
      .set({ status: GroupMemberStatus.REJECTED, respondedAt: new Date(), decidedBy: adminUserId })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
  }

  async withdrawJoinRequest(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.groupMembersService.findMemberOrThrow(groupId, requestingUserId);

    if (membership.status !== GroupMemberStatus.REQUEST) {
      throw new ConflictException('No pending join request to withdraw');
    }

    await this.db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));
  }
}
