import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, inArray, ne, or } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { assets } from '@/modules/assets/schema/assets.schema';
import { AssetResolverService } from '@/modules/assets/asset-resolver.service';
import { CloudStorageService } from '@/modules/cloud-storage/cloud-storage.service';
import { PUBLIC_OBJECT_PREFIXES } from '@/modules/cloud-storage/cloud-storage.constants';
import { userProfiles } from '@/modules/users/schema/user-profiles.schema';
import { users } from '@/modules/users/schema/users.schema';
import { ProfileVisibility } from '@chamuco/shared-types';
import type { ResolvedAsset } from '@chamuco/shared-types';
import { assetRowToAsset } from '@/modules/assets/asset.utils';
import type { AuthenticatedUser } from '@/types/express';
import type { UpdateAvatarDto } from './dto/update-avatar.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UsernameAvailabilityDto } from './dto/username-availability.dto';
import type { SearchUsersQueryDto } from './dto/search-users-query.dto';
import type { UserSearchResponseDto, UserSearchResultDto } from './dto/user-search-result.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly assetResolver: AssetResolverService,
    private readonly cloudStorage: CloudStorageService,
  ) {}

  async findByFirebaseUid(firebaseUid: string): Promise<AuthenticatedUser> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, firebaseUid),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityDto> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return { available: !existing, username };
  }

  async searchUsers(
    requestingUserId: string,
    dto: SearchUsersQueryDto,
  ): Promise<UserSearchResponseDto> {
    const { q, limit = 10 } = dto;

    if (!q) return { data: [], total: 0 };

    let searchCondition;
    if (q.startsWith('@')) {
      const stripped = q.slice(1);
      if (!stripped) return { data: [], total: 0 };
      searchCondition = ilike(users.username, `${stripped}%`);
    } else {
      searchCondition = or(ilike(users.username, `${q}%`), ilike(users.displayName, `%${q}%`));
    }

    const conditions = and(searchCondition, ne(users.id, requestingUserId));

    const countResult = await this.db.select({ total: count() }).from(users).where(conditions);
    const total = countResult[0]?.total ?? 0;

    if (total === 0) return { data: [], total: 0 };

    const rows = await this.db.query.users.findMany({
      where: conditions,
      limit,
      orderBy: (t, { asc }) => [asc(t.username)],
    });

    const avatarIds = rows.map((r) => r.avatar).filter((id): id is string => id !== null);
    const avatarAssets =
      avatarIds.length > 0
        ? await this.db.query.assets.findMany({ where: inArray(assets.id, avatarIds) })
        : [];
    const avatarMap = new Map(
      await Promise.all(
        avatarAssets.map(
          async (a) => [a.id, await this.assetResolver.resolve(assetRowToAsset(a))] as const,
        ),
      ),
    );

    const data: UserSearchResultDto[] = rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      avatar: row.avatar ? (avatarMap.get(row.avatar) ?? null) : null,
    }));

    return { data, total };
  }

  async updateMe(existingUser: AuthenticatedUser, dto: UpdateUserDto): Promise<UserResponseDto> {
    const patch: Partial<typeof users.$inferInsert> = {};
    if (dto.displayName !== undefined) patch.displayName = dto.displayName.trim();
    if (dto.timezone !== undefined) patch.timezone = dto.timezone;
    if (dto.profileVisibility !== undefined) patch.profileVisibility = dto.profileVisibility;

    if (Object.keys(patch).length === 0) {
      return this.mapUserResponse(existingUser);
    }

    const [updated] = await this.db
      .update(users)
      .set(patch)
      .where(eq(users.id, existingUser.id))
      .returning();

    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserResponse(updated);
  }

  async getMe(user: AuthenticatedUser): Promise<UserResponseDto> {
    // TODO: resolve avatar in the auth middleware so GET /v1/users/me stays zero-query.
    return this.mapUserResponse(user);
  }

  async getPublicProfile(username: string): Promise<PublicProfileResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const showGamification = user.profileVisibility === ProfileVisibility.PUBLIC;

    return {
      username: user.username,
      displayName: user.displayName,
      avatar: await this.fetchAndResolveAvatar(user.avatar ?? null),
      bio: profile?.bio ?? null,
      profileVisibility: user.profileVisibility,
      travelerScore: null,
      achievements: showGamification ? [] : null,
      recognitions: showGamification ? [] : null,
      keyStats: null,
      discoveryMap: showGamification ? [] : null,
    };
  }

  async updateAvatar(user: AuthenticatedUser, dto: UpdateAvatarDto): Promise<UserResponseDto> {
    const oldAsset = user.avatar
      ? await this.db.query.assets.findFirst({ where: eq(assets.id, user.avatar) })
      : null;

    const newUserId = user.id;
    await this.db.transaction(async (trx) => {
      const [newAsset] = await trx
        .insert(assets)
        .values({
          // type='image' for both gcs and emoji: asset_type describes rendered output (PNG image).
          // AssetResolverService dispatches on source, not type.
          type: 'image',
          source: dto.source,
          target: dto.target,
          fileSize: dto.fileSize ?? null,
          isPublic: true,
        })
        .returning();

      if (!newAsset) throw new Error('Failed to create asset record');
      await trx.update(users).set({ avatar: newAsset.id }).where(eq(users.id, newUserId));
    });

    if (dto.source === 'gcs') {
      const prefix = dto.target.split('/')[0];
      if (prefix && PUBLIC_OBJECT_PREFIXES.has(prefix)) {
        await this.cloudStorage.makePublic(dto.target);
      }
    }

    if (oldAsset) {
      if (oldAsset.source === 'gcs') {
        await this.cloudStorage.deleteObject(oldAsset.target).catch((e: unknown) => {
          console.error('[UsersService] GCS delete failed (orphan caught by audit):', e);
        });
      }
      await this.db.delete(assets).where(eq(assets.id, oldAsset.id));
    }

    const updatedUser = await this.db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!updatedUser) throw new NotFoundException('User not found');
    return this.mapUserResponse(updatedUser);
  }

  private async mapUserResponse(user: typeof users.$inferSelect): Promise<UserResponseDto> {
    const { firebaseUid: _, avatar, ...rest } = user;
    return { ...rest, avatar: await this.fetchAndResolveAvatar(avatar ?? null) };
  }

  private async fetchAndResolveAvatar(avatarId: string | null): Promise<ResolvedAsset | null> {
    if (!avatarId) return null;
    const row = await this.db.query.assets.findFirst({ where: eq(assets.id, avatarId) });
    if (!row) return null;
    return this.assetResolver.resolve(assetRowToAsset(row));
  }
}
