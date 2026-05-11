import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import type { Asset } from '@chamuco/shared-types';
import { GroupMemberStatus, GroupRole } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { PUBLIC_OBJECT_PREFIXES } from '@/modules/cloud-storage/cloud-storage.constants';
import type { AuthenticatedUser } from '@/types/express';
import { groups } from './schema/groups.schema';
import { groupMembers } from './schema/group-members.schema';
import { groupMemberStats } from './schema/group-member-stats.schema';
import type { CreateGroupDto } from './dto/create-group.dto';
import type { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupResponseDto } from './dto/group-response.dto';

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

    return Promise.all(groupRows.map((g) => this.fetchAndMapGroup(g.id)));
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

    const resolvedCover = await this.assetResolver.resolve(this.toAsset(coverRow));
    if (!resolvedCover) throw new NotFoundException('Failed to resolve group cover');

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      cover: resolvedCover,
      visibility: group.visibility,
      createdBy: group.createdBy,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  private toAsset(row: typeof assets.$inferSelect): Asset {
    return {
      id: row.id,
      type: row.type,
      source: row.source,
      target: row.target,
      fileSize: row.fileSize ?? undefined,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
