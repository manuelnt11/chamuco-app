import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, inArray, isNull, notInArray } from 'drizzle-orm';
import { GroupMemberStatus, GroupVisibility, MembershipStatus } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import type { GroupResponseDto } from '@/modules/groups/dto/group-response.dto';
import type { SearchGroupsQueryDto } from '@/modules/groups/dto/search-groups-query.dto';
import type { GroupSearchResponseDto } from '@/modules/groups/dto/group-search-result.dto';

@Injectable()
export class GroupsDiscoveryService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
  ) {}

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
        if (
          !rawStatus ||
          rawStatus === GroupMemberStatus.REMOVED ||
          rawStatus === GroupMemberStatus.LEFT ||
          rawStatus === GroupMemberStatus.REJECTED
        ) {
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
}
