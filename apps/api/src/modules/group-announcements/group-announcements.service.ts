import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';

import {
  GroupMemberStatus,
  GroupRole,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { users } from '@/modules/users/schema/users.schema';
import { groups } from '@/modules/groups/schema/groups.schema';
import { groupMembers } from '@/modules/groups/schema/group-members.schema';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { groupAnnouncements } from './schema/group-announcements.schema';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { AnnouncementResponseDto } from './dto/announcement-response.dto';
import type { ListAnnouncementsQueryDto } from './dto/list-announcements-query.dto';

const ADMIN_ROLES = [GroupRole.OWNER, GroupRole.ADMIN] as const;

@Injectable()
export class GroupAnnouncementsService {
  private readonly logger = new Logger(GroupAnnouncementsService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    groupId: string,
    callerId: string,
    callerUsername: string,
    dto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    await this.assertGroupAdmin(groupId, callerId);

    const [inserted] = await this.db
      .insert(groupAnnouncements)
      .values({ groupId, createdBy: callerId, content: dto.content })
      .returning();

    if (!inserted) throw new Error('Failed to create announcement');

    const [memberRows, group] = await Promise.all([
      this.db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(
          and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, GroupMemberStatus.ACTIVE)),
        ),
      this.db.query.groups.findFirst({
        where: and(eq(groups.id, groupId), isNull(groups.deletedAt)),
        columns: { name: true },
      }),
    ]);

    const userIds = memberRows.map((r) => r.userId).filter((id) => id !== callerId);

    this.notifications
      .notifyMany(
        userIds,
        NotificationType.GROUP_ANNOUNCEMENT,
        {
          groupId,
          groupName: group?.name ?? '',
          senderUsername: callerUsername,
          announcementId: inserted.id,
        },
        [NotificationChannel.PUSH],
      )
      .catch((err: unknown) =>
        this.logger.error('Failed to send group announcement notifications', err),
      );

    return this.toDto(inserted, callerUsername);
  }

  async findOne(
    groupId: string,
    announcementId: string,
    callerId: string,
  ): Promise<AnnouncementResponseDto> {
    await this.assertActiveMember(groupId, callerId);

    const row = await this.db
      .select({
        id: groupAnnouncements.id,
        groupId: groupAnnouncements.groupId,
        content: groupAnnouncements.content,
        createdAt: groupAnnouncements.createdAt,
        updatedAt: groupAnnouncements.updatedAt,
        createdByUsername: users.username,
      })
      .from(groupAnnouncements)
      .innerJoin(users, eq(groupAnnouncements.createdBy, users.id))
      .where(
        and(eq(groupAnnouncements.id, announcementId), eq(groupAnnouncements.groupId, groupId)),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) throw new NotFoundException('Announcement not found');

    return this.toDto(row, row.createdByUsername);
  }

  async findAll(
    groupId: string,
    callerId: string,
    query: ListAnnouncementsQueryDto,
  ): Promise<{ items: AnnouncementResponseDto[]; total: number }> {
    await this.assertActiveMember(groupId, callerId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id: groupAnnouncements.id,
          groupId: groupAnnouncements.groupId,
          content: groupAnnouncements.content,
          createdAt: groupAnnouncements.createdAt,
          updatedAt: groupAnnouncements.updatedAt,
          createdByUsername: users.username,
        })
        .from(groupAnnouncements)
        .innerJoin(users, eq(groupAnnouncements.createdBy, users.id))
        .where(eq(groupAnnouncements.groupId, groupId))
        .orderBy(desc(groupAnnouncements.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(groupAnnouncements)
        .where(eq(groupAnnouncements.groupId, groupId)),
    ]);

    return {
      items: rows.map((r) => this.toDto(r, r.createdByUsername)),
      total: countRow?.value ?? 0,
    };
  }

  async update(
    groupId: string,
    announcementId: string,
    callerId: string,
    dto: UpdateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    await this.assertGroupAdmin(groupId, callerId);

    const existing = await this.db.query.groupAnnouncements.findFirst({
      where: and(
        eq(groupAnnouncements.id, announcementId),
        eq(groupAnnouncements.groupId, groupId),
      ),
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    const [updated] = await this.db
      .update(groupAnnouncements)
      .set({ content: dto.content })
      .where(
        and(eq(groupAnnouncements.id, announcementId), eq(groupAnnouncements.groupId, groupId)),
      )
      .returning();

    if (!updated) throw new Error('Failed to update announcement');

    const creator = await this.db.query.users.findFirst({
      where: eq(users.id, existing.createdBy),
      columns: { username: true },
    });

    return this.toDto(updated, creator?.username ?? '');
  }

  async remove(groupId: string, announcementId: string, callerId: string): Promise<void> {
    await this.assertGroupAdmin(groupId, callerId);

    const existing = await this.db.query.groupAnnouncements.findFirst({
      where: and(
        eq(groupAnnouncements.id, announcementId),
        eq(groupAnnouncements.groupId, groupId),
      ),
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    await this.db
      .delete(groupAnnouncements)
      .where(
        and(eq(groupAnnouncements.id, announcementId), eq(groupAnnouncements.groupId, groupId)),
      );
  }

  private async assertGroupAdmin(groupId: string, userId: string): Promise<void> {
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

  private async assertGroupExists(groupId: string): Promise<void> {
    const group = await this.db.query.groups.findFirst({
      where: and(eq(groups.id, groupId), isNull(groups.deletedAt)),
    });
    if (!group) throw new NotFoundException('Group not found');
  }

  private toDto(
    row: Pick<
      typeof groupAnnouncements.$inferSelect,
      'id' | 'groupId' | 'content' | 'createdAt' | 'updatedAt'
    >,
    createdByUsername: string,
  ): AnnouncementResponseDto {
    return {
      id: row.id,
      groupId: row.groupId,
      createdByUsername,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
