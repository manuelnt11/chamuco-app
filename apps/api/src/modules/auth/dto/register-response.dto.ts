import { ApiProperty } from '@nestjs/swagger';
import type { ResolvedAsset } from '@chamuco/shared-types';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { ResolvedAssetDto } from '@/modules/assets/dto/resolved-asset.dto';

export class RegisterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'john_doe' })
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  displayName!: string;

  @ApiProperty({ type: () => ResolvedAssetDto, nullable: true })
  avatar!: ResolvedAsset | null;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.GOOGLE })
  authProvider!: AuthProvider;

  @ApiProperty({ example: 'America/Bogota' })
  timezone!: string;

  @ApiProperty({ enum: PlatformRole, example: PlatformRole.USER })
  platformRole!: PlatformRole;

  @ApiProperty({ example: null, nullable: true })
  agencyId!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  lastActiveAt!: Date;
}
