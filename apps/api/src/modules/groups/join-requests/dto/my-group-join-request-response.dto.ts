import { ApiProperty } from '@nestjs/swagger';

import { GroupVisibility } from '@chamuco/shared-types';

export class MyGroupJoinRequestResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  groupId!: string;

  @ApiProperty({ example: 'Mountain Crew' })
  name!: string;

  @ApiProperty({
    description:
      'Ready-to-use URL for the group cover image or emoji (Twemoji CDN). Null when the cover asset could not be resolved.',
    example: 'https://cdn.jsdelivr.net/npm/twemoji/2/svg/1f3d4.svg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiProperty({ enum: GroupVisibility, example: GroupVisibility.PUBLIC })
  visibility!: GroupVisibility;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
