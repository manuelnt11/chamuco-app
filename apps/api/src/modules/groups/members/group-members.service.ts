import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';
import {
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { groupMemberStats } from '@/modules/groups/schema/group-member-stats.schema';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { MemberResponseDto } from './dto/member-response.dto';
import type { PendingItemResponseDto } from './dto/pending-item-response.dto';
import type { MyMembershipResponseDto } from './dto/my-membership-response.dto';
import type { MyInvitationResponseDto } from '@/modules/groups/dto/my-invitation-response.dto';

const ADMIN_ROLES = [GroupRole.OWNER, GroupRole.ADMIN] as const;

@Injectable()
export class GroupMembersService {
  private readonly logger = new Logger(GroupMembersService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Remove / Leave ───────────────────────────────────────────────────────────

  async removeMember(
    groupId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    await this.assertGroupExists(groupId);

    const targetMembership = await this.findMemberOrThrow(groupId, targetUserId);

    if (requestingUserId === targetUserId) {
      // Self-action: withdraw pending request/invitation, or leave
      if (
        targetMembership.status === GroupMemberStatus.REQUEST ||
        targetMembership.status === GroupMemberStatus.INVITED
      ) {
        await this.db
          .delete(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
        return;
      }

      if (targetMembership.status === GroupMemberStatus.ACTIVE) {
        await this.assertNotSoleAdmin(groupId, targetUserId);
        await this.db.transaction(async (trx) => {
          const now = new Date();
          await trx
            .update(groupMembers)
            .set({ status: GroupMemberStatus.LEFT, respondedAt: now, decidedBy: targetUserId })
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

          const [activeCount] = await trx
            .select({ total: count() })
            .from(groupMembers)
            .where(
              and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.status, GroupMemberStatus.ACTIVE),
              ),
            );

          if ((activeCount?.total ?? 0) === 0) {
            await trx.update(groups).set({ deletedAt: now }).where(eq(groups.id, groupId));
          }
        });
        return;
      }

      throw new ConflictException('No active membership to leave');
    }

    // Admin removing another member — load requester only when needed
    const requesterMembership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requestingUserId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });

    if (
      !requesterMembership ||
      !ADMIN_ROLES.includes(requesterMembership.role as (typeof ADMIN_ROLES)[number])
    ) {
      throw new ForbiddenException('Only group admins can remove members');
    }

    if (targetMembership.status !== GroupMemberStatus.ACTIVE) {
      throw new ConflictException('Target user is not an active member');
    }

    // Only an OWNER can remove another OWNER
    if (targetMembership.role === GroupRole.OWNER && requesterMembership.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the group owner can remove another owner');
    }

    await this.assertNotSoleAdmin(groupId, targetUserId);

    await this.db
      .update(groupMembers)
      .set({
        status: GroupMemberStatus.REMOVED,
        respondedAt: new Date(),
        decidedBy: requestingUserId,
      })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });
    await this.notifications
      .notify(
        targetUserId,
        NotificationType.GROUP_MEMBER_REMOVED,
        { groupId, groupName: group?.name ?? '' },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) => {
        this.logger.error('Failed to send GROUP_MEMBER_REMOVED notification', err);
      });
  }

  // ─── Role management ──────────────────────────────────────────────────────────

  async updateMemberRole(
    groupId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    requestingUserId: string,
  ): Promise<void> {
    const requesterMembership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requestingUserId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });

    if (
      !requesterMembership ||
      !ADMIN_ROLES.includes(requesterMembership.role as (typeof ADMIN_ROLES)[number])
    ) {
      throw new ForbiddenException('Only group admins can update member roles');
    }

    const targetMembership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });
    if (!targetMembership) throw new NotFoundException('Active member not found');

    if (dto.role === GroupRole.OWNER) {
      // OWNER transfer: only current OWNER can transfer ownership
      if (requesterMembership.role !== GroupRole.OWNER) {
        throw new ForbiddenException('Only the group owner can transfer ownership');
      }
      await this.db.transaction(async (trx) => {
        await trx
          .update(groupMembers)
          .set({ role: GroupRole.OWNER })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
        await trx
          .update(groupMembers)
          .set({ role: GroupRole.ADMIN })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));
      });
      return;
    }

    // Downgrade guard: can't demote the last admin
    if (dto.role === GroupRole.MEMBER) {
      await this.assertNotSoleAdmin(groupId, targetUserId);
    }

    await this.db
      .update(groupMembers)
      .set({ role: dto.role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

    const group = await this.db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });
    const roleNotificationType =
      dto.role === GroupRole.ADMIN
        ? NotificationType.GROUP_MEMBER_PROMOTED
        : NotificationType.GROUP_MEMBER_DEMOTED;
    await this.notifications
      .notify(targetUserId, roleNotificationType, { groupId, groupName: group?.name ?? '' }, [
        NotificationChannel.PUSH,
      ])
      .catch((err: unknown) => {
        this.logger.error(`Failed to send ${roleNotificationType} notification`, err);
      });
  }

  // ─── My membership ───────────────────────────────────────────────────────────

  async getMyMembership(groupId: string, userId: string): Promise<MyMembershipResponseDto> {
    await this.assertGroupExists(groupId);

    const membership = await this.db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership) throw new NotFoundException('Membership not found');

    return {
      status: membership.status as GroupMemberStatus,
      role: membership.role as GroupRole,
    };
  }

  async listMyInvitations(userId: string): Promise<MyInvitationResponseDto[]> {
    const rows = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.INVITED),
      ),
    });

    if (rows.length === 0) return [];

    const groupIds = rows.map((r) => r.groupId);
    const groupRows = await this.db.query.groups.findMany({
      where: and(inArray(groups.id, groupIds), isNull(groups.deletedAt)),
    });

    const coverIds = groupRows.map((g) => g.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));

    const groupMap = new Map(groupRows.map((g) => [g.id, g]));

    return Promise.all(
      rows
        .filter((r) => groupMap.has(r.groupId))
        .map(async (membership) => {
          const group = groupMap.get(membership.groupId)!;
          const coverRow = group.cover ? (assetMap.get(group.cover) ?? null) : null;
          const resolvedCover = await this.assetResolver.resolve(
            coverRow ? assetRowToAsset(coverRow) : null,
          );
          if (!resolvedCover)
            throw new NotFoundException(`Cover asset not found for group ${group.id}`);

          return {
            group: { id: group.id, name: group.name, coverUrl: resolvedCover.url },
            initiatedAt: membership.initiatedAt.toISOString(),
          };
        }),
    );
  }

  // ─── List endpoints ───────────────────────────────────────────────────────────

  async listActiveMembers(groupId: string, requestingUserId: string): Promise<MemberResponseDto[]> {
    await this.assertActiveMember(groupId, requestingUserId);

    const rows = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const statsRows = await this.db.query.groupMemberStats.findMany({
      where: and(eq(groupMemberStats.groupId, groupId), inArray(groupMemberStats.userId, userIds)),
    });

    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const statsMap = new Map(statsRows.map((s) => [s.userId, s]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((membership) => {
      const user = userMap.get(membership.userId);
      if (!user) throw new NotFoundException(`User ${membership.userId} not found`);
      const stats = statsMap.get(membership.userId);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        role: membership.role as GroupRole,
        tier: (stats?.tier ?? GroupMemberTier.NEWCOMER) as GroupMemberTier,
        joinedAt: stats?.joinedAt.toISOString() ?? membership.initiatedAt.toISOString(),
      };
    });
  }

  async listPendingMembers(
    groupId: string,
    requestingUserId: string,
  ): Promise<PendingItemResponseDto[]> {
    await this.assertGroupAdmin(groupId, requestingUserId);

    const rows = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.groupId, groupId),
        inArray(groupMembers.status, [GroupMemberStatus.REQUEST, GroupMemberStatus.INVITED]),
      ),
    });

    const userIds = rows.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userRows = await this.db.query.users.findMany({ where: inArray(users.id, userIds) });
    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const avatarUrlMap = await this.batchResolveAvatarUrls(userRows);

    return rows.map((membership) => {
      const user = userMap.get(membership.userId);
      if (!user) throw new NotFoundException(`User ${membership.userId} not found`);

      return {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: avatarUrlMap.get(user.id) ?? null,
        status: membership.status as GroupMemberStatus.REQUEST | GroupMemberStatus.INVITED,
        initiatedAt: membership.initiatedAt.toISOString(),
      };
    });
  }

  // ─── Shared helpers (public — used by GroupJoinRequestsService / GroupInvitationsService) ──

  async findMemberOrThrow(
    groupId: string,
    userId: string,
  ): Promise<typeof groupMembers.$inferSelect> {
    const membership = await this.db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });
    if (!membership) throw new NotFoundException('Membership record not found');
    return membership;
  }

  async assertGroupExists(groupId: string): Promise<typeof groups.$inferSelect> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, groupId), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async assertGroupAdmin(groupId: string, userId: string): Promise<void> {
    await this.assertGroupExists(groupId);

    const membership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        inArray(groupMembers.role, [...ADMIN_ROLES]),
      ),
    });
    if (!membership) throw new ForbiddenException('Only group admins can perform this action');
  }

  private async assertActiveMember(groupId: string, userId: string): Promise<void> {
    await this.assertGroupExists(groupId);

    const membership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });
    if (!membership)
      throw new ForbiddenException('Only active group members can perform this action');
  }

  private async assertNotSoleAdmin(groupId: string, userId: string): Promise<void> {
    const activeAdmins = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        inArray(groupMembers.role, [...ADMIN_ROLES]),
      ),
      limit: 2,
    });

    if (activeAdmins.length === 1 && activeAdmins[0]?.userId === userId) {
      throw new ConflictException(
        'Cannot remove or demote the last admin. Promote another member first.',
      );
    }
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
}
