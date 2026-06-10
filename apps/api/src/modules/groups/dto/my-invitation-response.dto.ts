import { ApiProperty } from '@nestjs/swagger';

class InvitationGroupDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Mountain Crew' })
  name!: string;

  @ApiProperty({
    description: 'Ready-to-use URL for the group cover image or emoji (Twemoji CDN).',
    example: 'https://cdn.jsdelivr.net/npm/twemoji/2/svg/1f3d4.svg',
  })
  coverUrl!: string;
}

export class MyInvitationResponseDto {
  @ApiProperty({ type: InvitationGroupDto })
  group!: InvitationGroupDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
