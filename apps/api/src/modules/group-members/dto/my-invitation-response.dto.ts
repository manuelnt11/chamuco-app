import { ApiProperty } from '@nestjs/swagger';

import type { ResolvedAsset } from '@chamuco/shared-types';

class InvitationGroupDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Mountain Crew' })
  name!: string;

  @ApiProperty({ description: 'Resolved cover asset' })
  cover!: ResolvedAsset;
}

export class MyInvitationResponseDto {
  @ApiProperty({ type: InvitationGroupDto })
  group!: InvitationGroupDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
