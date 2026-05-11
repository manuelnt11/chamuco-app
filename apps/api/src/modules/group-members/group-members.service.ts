import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import { GroupMemberStatus, GroupMemberTier, GroupRole } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { groupMemberStats } from '@/modules/groups/schema/group-member-stats.schema';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { MemberResponseDto } from './dto/member-response.dto';
import type { PendingItemResponseDto } from './dto/pending-item-response.dto';

const ADMIN_ROLES = [GroupRole.OWNER, GroupRole.ADMIN] as const;

@Injectable()
export class GroupMembersService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
  ) {}

  // ─── Join request ────────────────────────────────────────────────────────────

  async submitJoinRequest(groupId: string, requestingUserId: string): Promise<void> {
    const group = await this.db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) throw new NotFoundException('Group not found');
    if (group.visibility !== 'PUBLIC') {
      throw new ForbiddenException('Join requests are only allowed for public groups');
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
      // Re-request after REJECTED / REMOVED / LEFT
      await this.db
        .update(groupMembers)
        .set({
          status: GroupMemberStatus.REQUEST,
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
    await this.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.findMemberOrThrow(groupId, targetUserId);

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
  }

  async rejectJoinRequest(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
  ): Promise<void> {
    await this.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.findMemberOrThrow(groupId, targetUserId);

    if (membership.status !== GroupMemberStatus.REQUEST) {
      throw new ConflictException('No pending join request found for this user');
    }

    await this.db
      .update(groupMembers)
      .set({ status: GroupMemberStatus.REJECTED, respondedAt: new Date(), decidedBy: adminUserId })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
  }

  async withdrawJoinRequest(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.findMemberOrThrow(groupId, requestingUserId);

    if (membership.status !== GroupMemberStatus.REQUEST) {
      throw new ConflictException('No pending join request to withdraw');
    }

    await this.db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requestingUserId)));
  }

  // ─── Invitation ──────────────────────────────────────────────────────────────

  async sendInvitation(
    groupId: string,
    dto: CreateInvitationDto,
    adminUserId: string,
  ): Promise<void> {
    await this.assertGroupAdmin(groupId, adminUserId);

    const targetUser = await this.db.query.users.findFirst({
      where: eq(users.username, dto.targetUsername),
    });
    if (!targetUser) throw new NotFoundException(`User @${dto.targetUsername} not found`);

    const existing = await this.db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUser.id)),
    });

    if (existing) {
      if (
        existing.status === GroupMemberStatus.ACTIVE ||
        existing.status === GroupMemberStatus.INVITED
      ) {
        throw new ConflictException('User is already an active member or has a pending invitation');
      }
      // Re-invite after REJECTED / REMOVED / LEFT
      await this.db
        .update(groupMembers)
        .set({
          status: GroupMemberStatus.INVITED,
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
  }

  async acceptInvitation(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.findMemberOrThrow(groupId, requestingUserId);

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
  }

  async declineInvitation(groupId: string, requestingUserId: string): Promise<void> {
    const membership = await this.findMemberOrThrow(groupId, requestingUserId);

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
    await this.assertGroupAdmin(groupId, adminUserId);
    const membership = await this.findMemberOrThrow(groupId, targetUserId);

    if (membership.status !== GroupMemberStatus.INVITED) {
      throw new ConflictException('No pending invitation to revoke');
    }

    await this.db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
  }

  // ─── Remove / Leave ───────────────────────────────────────────────────────────

  async removeMember(
    groupId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    const group = await this.db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) throw new NotFoundException('Group not found');

    const requesterMembership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requestingUserId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });

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
        await this.db
          .update(groupMembers)
          .set({ status: GroupMemberStatus.LEFT, respondedAt: new Date(), decidedBy: targetUserId })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

        await this.dissolveIfEmpty(groupId);
        return;
      }

      throw new ConflictException('No active membership to leave');
    }

    // Admin removing another member
    if (
      !requesterMembership ||
      !ADMIN_ROLES.includes(requesterMembership.role as (typeof ADMIN_ROLES)[number])
    ) {
      throw new ForbiddenException('Only group admins can remove members');
    }

    if (targetMembership.status !== GroupMemberStatus.ACTIVE) {
      throw new ConflictException('Target user is not an active member');
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

    return Promise.all(
      rows.map(async (membership) => {
        const user = userMap.get(membership.userId);
        if (!user) throw new Error(`User ${membership.userId} not found`);
        const stats = statsMap.get(membership.userId);
        const avatarUrl = await this.resolveAvatarUrl(user.avatar ?? null);

        return {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl,
          role: membership.role as GroupRole,
          tier: (stats?.tier ?? GroupMemberTier.NEWCOMER) as GroupMemberTier,
          joinedAt: stats?.joinedAt.toISOString() ?? membership.initiatedAt.toISOString(),
        };
      }),
    );
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

    return Promise.all(
      rows.map(async (membership) => {
        const user = userMap.get(membership.userId);
        if (!user) throw new Error(`User ${membership.userId} not found`);
        const avatarUrl = await this.resolveAvatarUrl(user.avatar ?? null);

        return {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl,
          status: membership.status as GroupMemberStatus.REQUEST | GroupMemberStatus.INVITED,
          initiatedAt: membership.initiatedAt.toISOString(),
        };
      }),
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async findMemberOrThrow(groupId: string, userId: string) {
    const membership = await this.db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });
    if (!membership) throw new NotFoundException('Membership record not found');
    return membership;
  }

  private async assertGroupAdmin(groupId: string, userId: string): Promise<void> {
    const group = await this.db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) throw new NotFoundException('Group not found');

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
    const group = await this.db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) throw new NotFoundException('Group not found');

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
    const [result] = await this.db
      .select({ total: count() })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, GroupMemberStatus.ACTIVE),
          inArray(groupMembers.role, [...ADMIN_ROLES]),
        ),
      );

    const adminCount = result?.total ?? 0;

    if (adminCount === 1) {
      const sole = await this.db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, GroupMemberStatus.ACTIVE),
          inArray(groupMembers.role, [...ADMIN_ROLES]),
        ),
      });
      if (sole?.userId === userId) {
        throw new ConflictException(
          'Cannot remove or demote the last admin. Promote another member first.',
        );
      }
    }
  }

  private async dissolveIfEmpty(groupId: string): Promise<void> {
    const [result] = await this.db
      .select({ total: count() })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, GroupMemberStatus.ACTIVE)),
      );

    if ((result?.total ?? 0) === 0) {
      await this.db.transaction(async (trx) => {
        await trx.delete(groupMemberStats).where(eq(groupMemberStats.groupId, groupId));
        await trx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
        await trx.delete(groups).where(eq(groups.id, groupId));
      });
    }
  }

  private async resolveAvatarUrl(avatarId: string | null): Promise<string | null> {
    if (!avatarId) return null;

    const avatarAsset = await this.db.query.assets.findFirst({
      where: eq(assets.id, avatarId),
    });
    if (!avatarAsset) return null;

    const resolved = await this.assetResolver.resolve({
      id: avatarAsset.id,
      type: avatarAsset.type,
      source: avatarAsset.source,
      target: avatarAsset.target,
      fileSize: avatarAsset.fileSize ?? undefined,
      isPublic: avatarAsset.isPublic,
      createdAt: avatarAsset.createdAt.toISOString(),
    });

    return resolved?.url ?? null;
  }
}
