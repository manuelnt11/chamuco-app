import { ApiProperty } from '@nestjs/swagger';

import { GroupVisibility } from '@chamuco/shared-types';
import { ResolvedAssetDto } from '@/modules/users/dto/user-response.dto';

export class GroupResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Mountain Crew' })
  name!: string;

  @ApiProperty({ example: 'A group for mountain hiking enthusiasts.', nullable: true })
  description!: string | null;

  @ApiProperty({ type: ResolvedAssetDto })
  cover!: ResolvedAssetDto;

  @ApiProperty({ enum: GroupVisibility, example: GroupVisibility.PUBLIC })
  visibility!: GroupVisibility;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  createdBy!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: string;
}
