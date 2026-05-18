import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, inArray, isNull, notInArray } from 'drizzle-orm';

import {
  GroupMemberStatus,
  GroupRole,
  GroupVisibility,
  MembershipStatus,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { PUBLIC_OBJECT_PREFIXES } from '@/modules/cloud-storage/cloud-storage.constants';
import type { AuthenticatedUser } from '@/types/express';
import { groups } from './schema/groups.schema';
import { groupMembers } from './schema/group-members.schema';
import { groupMemberStats } from './schema/group-member-stats.schema';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupResponseDto } from './dto/group-response.dto';
import type { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import type { GroupSearchResponseDto } from './dto/group-search-result.dto';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly cloudStorage: CloudStorageService,
  ) {}

  async createGroup(user: AuthenticatedUser, dto: CreateGroupDto): Promise<GroupResponseDto> {
    let groupId!: string;

    await this.db.transaction(async (trx) => {
      const [coverAsset] = await trx
        .insert(assets)
        .values({
          type: 'image',
          source: dto.cover.source,
          target: dto.cover.target,
          fileSize: dto.cover.fileSize ?? null,
          isPublic: true,
        })
        .returning();

      if (!coverAsset) throw new Error('Failed to create cover asset');

      const [group] = await trx
        .insert(groups)
        .values({
          name: dto.name,
          description: dto.description ?? null,
          cover: coverAsset.id,
          visibility: dto.visibility,
          createdBy: user.id,
        })
        .returning();

      if (!group) throw new Error('Failed to create group');

      const now = new Date();

      await trx.insert(groupMembers).values({
        groupId: group.id,
        userId: user.id,
        status: GroupMemberStatus.ACTIVE,
        role: GroupRole.OWNER,
        initiatedBy: user.id,
        respondedAt: now,
        decidedBy: user.id,
      });

      await trx.insert(groupMemberStats).values({
        groupId: group.id,
        userId: user.id,
        joinedAt: now,
      });

      groupId = group.id;
    });

    if (dto.cover.source === 'gcs') {
      const prefix = dto.cover.target.split('/')[0];
      if (prefix && PUBLIC_OBJECT_PREFIXES.has(prefix)) {
        await this.cloudStorage.makePublic(dto.cover.target);
      }
    }

    return this.fetchAndMapGroup(groupId);
  }

  async findById(id: string): Promise<typeof groups.$inferSelect | null> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, id), isNull(groups.deletedAt)),
    });
    return group ?? null;
  }

  async getGroup(requestingUserId: string, id: string): Promise<GroupResponseDto> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, id), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');

    if (group.visibility === 'PRIVATE') {
      const membership = await this.db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, id),
          eq(groupMembers.userId, requestingUserId),
          eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        ),
      });
      if (!membership) throw new NotFoundException('Group not found');
    }

    return this.fetchAndMapGroup(id);
  }

  async listMyGroups(userId: string): Promise<GroupResponseDto[]> {
    const memberships = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
    });

    if (memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.groupId);
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
          id: group.id,
          name: group.name,
          description: group.description,
          coverUrl: resolvedCover.url,
          visibility: group.visibility,
          createdBy: group.createdBy,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        };
      }),
    );
  }

  async searchGroups(userId: string, query: SearchGroupsQueryDto): Promise<GroupSearchResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    // Exclude groups where the user is already an active member
    const activeMemberships = await this.db.query.groupMembers.findMany({
      where: and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
      columns: { groupId: true },
    });
    const excludedIds = activeMemberships.map((m) => m.groupId);

    const conditions = and(
      eq(groups.visibility, GroupVisibility.PUBLIC),
      isNull(groups.deletedAt),
      ...(excludedIds.length > 0 ? [notInArray(groups.id, excludedIds)] : []),
      ...(query.q ? [ilike(groups.name, `%${query.q}%`)] : []),
    );

    // Count total matching groups
    const countResult = await this.db.select({ total: count() }).from(groups).where(conditions);
    const total = countResult[0]?.total ?? 0;

    if (total === 0) return { data: [], total: 0 };

    // Fetch the requested page
    const groupRows = await this.db.query.groups.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    if (groupRows.length === 0) return { data: [], total };

    const groupIds = groupRows.map((g) => g.id);

    // Batch-load active member counts
    const activeMembers = await this.db.query.groupMembers.findMany({
      where: and(
        inArray(groupMembers.groupId, groupIds),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
      ),
      columns: { groupId: true },
    });
    const memberCountMap = new Map<string, number>();
    for (const row of activeMembers) {
      memberCountMap.set(row.groupId, (memberCountMap.get(row.groupId) ?? 0) + 1);
    }

    // Get the user's membership status for each group in the page
    const userMemberships = await this.db.query.groupMembers.findMany({
      where: and(inArray(groupMembers.groupId, groupIds), eq(groupMembers.userId, userId)),
      columns: { groupId: true, status: true },
    });
    const membershipStatusMap = new Map(userMemberships.map((m) => [m.groupId, m.status]));

    // Resolve cover assets
    const coverIds = groupRows.map((g) => g.cover).filter((id): id is string => id !== null);
    const coverAssets =
      coverIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, coverIds) })
        : [];
    const assetMap = new Map(coverAssets.map((a) => [a.id, a]));

    const data = await Promise.all(
      groupRows.map(async (group) => {
        if (!group.cover) throw new NotFoundException('Group cover asset not found');
        const coverRow = assetMap.get(group.cover);
        if (!coverRow) throw new NotFoundException('Group cover asset not found');
        const resolvedCover = await this.assetResolver.resolve(assetRowToAsset(coverRow));
        if (!resolvedCover) throw new NotFoundException('Failed to resolve group cover');

        const rawStatus = membershipStatusMap.get(group.id);
        let membershipStatus: MembershipStatus;
        if (!rawStatus) {
          membershipStatus = 'none';
        } else if (
          rawStatus === GroupMemberStatus.REQUEST ||
          rawStatus === GroupMemberStatus.INVITED
        ) {
          membershipStatus = 'pending';
        } else {
          membershipStatus = 'active';
        }

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          coverUrl: resolvedCover.url,
          visibility: group.visibility,
          createdBy: group.createdBy,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
          memberCount: memberCountMap.get(group.id) ?? 0,
          membershipStatus,
        };
      }),
    );

    return { data, total };
  }

  async updateGroup(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, id), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, id),
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        inArray(groupMembers.role, [GroupRole.OWNER, GroupRole.ADMIN]),
      ),
    });
    if (!membership) throw new ForbiddenException('Only group admins can update this group');

    const patch: Partial<typeof groups.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.visibility !== undefined) patch.visibility = dto.visibility;

    if (dto.cover) {
      let oldAsset: typeof assets.$inferSelect | undefined;

      await this.db.transaction(async (trx) => {
        oldAsset = group.cover
          ? await trx.query.assets.findFirst({ where: eq(assets.id, group.cover) })
          : undefined;

        const [newAsset] = await trx
          .insert(assets)
          .values({
            type: 'image',
            source: dto.cover!.source,
            target: dto.cover!.target,
            fileSize: dto.cover!.fileSize ?? null,
            isPublic: true,
          })
          .returning();

        if (!newAsset) throw new Error('Failed to create cover asset');

        await trx
          .update(groups)
          .set({ ...patch, cover: newAsset.id })
          .where(eq(groups.id, id));
      });

      if (dto.cover.source === 'gcs') {
        const prefix = dto.cover.target.split('/')[0];
        if (prefix && PUBLIC_OBJECT_PREFIXES.has(prefix)) {
          await this.cloudStorage.makePublic(dto.cover.target);
        }
      }

      if (oldAsset) {
        if (oldAsset.source === 'gcs') {
          await this.cloudStorage.deleteObject(oldAsset.target).catch((e: unknown) => {
            console.error('[GroupsService] GCS delete failed (orphan caught by audit):', e);
          });
        }
        await this.db.delete(assets).where(eq(assets.id, oldAsset.id));
      }
    } else if (Object.keys(patch).length > 0) {
      await this.db.update(groups).set(patch).where(eq(groups.id, id));
    }

    return this.fetchAndMapGroup(id);
  }

  async deleteGroup(user: AuthenticatedUser, id: string): Promise<void> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, id), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, id),
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, GroupMemberStatus.ACTIVE),
        eq(groupMembers.role, GroupRole.OWNER),
      ),
    });
    if (!membership) throw new ForbiddenException('Only the group owner can delete this group');

    const coverAsset = group.cover
      ? await this.db.query.assets.findFirst({ where: eq(assets.id, group.cover) })
      : null;

    // Soft-delete: null the cover FK so the asset row can be cleaned up after commit (rule #7)
    await this.db
      .update(groups)
      .set({ deletedAt: new Date(), cover: null })
      .where(eq(groups.id, id));

    if (coverAsset) {
      if (coverAsset.source === 'gcs') {
        await this.cloudStorage.deleteObject(coverAsset.target).catch((e: unknown) => {
          console.error('[GroupsService] GCS delete failed (orphan caught by audit):', e);
        });
      }
      await this.db.delete(assets).where(eq(assets.id, coverAsset.id));
    }
  }

  private async fetchAndMapGroup(id: string): Promise<GroupResponseDto> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, id), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');
    if (!group.cover) throw new NotFoundException('Group cover asset not found');

    const coverRow = await this.db.query.assets.findFirst({ where: eq(assets.id, group.cover) });
    if (!coverRow) throw new NotFoundException('Group cover asset not found');

    const resolvedCover = await this.assetResolver.resolve(assetRowToAsset(coverRow));
    if (!resolvedCover) throw new NotFoundException('Failed to resolve group cover');

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      coverUrl: resolvedCover.url,
      visibility: group.visibility,
      createdBy: group.createdBy,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }
}
