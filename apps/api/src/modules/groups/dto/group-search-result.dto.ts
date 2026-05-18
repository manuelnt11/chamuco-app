import { ApiProperty } from '@nestjs/swagger';

import { GroupVisibility } from '@chamuco/shared-types';

export type MembershipStatus = 'none' | 'pending' | 'active';

export class GroupSearchResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Mountain Crew' })
  name!: string;

  @ApiProperty({
    example: 'A group for mountain hiking enthusiasts.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Ready-to-use URL for the group cover image or emoji (Twemoji CDN).',
    example: 'https://cdn.jsdelivr.net/npm/twemoji/2/svg/1f3d4.svg',
  })
  coverUrl!: string;

  @ApiProperty({ enum: GroupVisibility, example: GroupVisibility.PUBLIC })
  visibility!: GroupVisibility;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  createdBy!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ description: 'Number of active members in the group', example: 12 })
  memberCount!: number;

  @ApiProperty({
    description: "The requesting user's membership status in this group",
    enum: ['none', 'pending', 'active'],
    example: 'none',
  })
  membershipStatus!: MembershipStatus;
}

export class GroupSearchResponseDto {
  @ApiProperty({ type: [GroupSearchResultDto] })
  data!: GroupSearchResultDto[];

  @ApiProperty({ description: 'Total number of matching groups (before pagination)', example: 42 })
  total!: number;
}
