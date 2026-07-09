import { ApiProperty } from '@nestjs/swagger';
import type { ResolvedAsset, UserSearchResult, UserSearchResponse } from '@chamuco/shared-types';
import { ResolvedAssetDto } from '@/modules/assets/dto/resolved-asset.dto';

export class UserSearchResultDto implements UserSearchResult {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'john_doe' })
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  displayName!: string;

  @ApiProperty({ type: () => ResolvedAssetDto, nullable: true })
  avatar!: ResolvedAsset | null;
}

export class UserSearchResponseDto implements UserSearchResponse {
  @ApiProperty({ type: [UserSearchResultDto] })
  data!: UserSearchResultDto[];

  @ApiProperty({ description: 'Total number of matching users (before pagination)', example: 5 })
  total!: number;
}
