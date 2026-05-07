import { ApiProperty } from '@nestjs/swagger';
import type { ResolvedAsset } from '@chamuco/shared-types';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';

export class ResolvedAssetDto implements ResolvedAsset {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: ['image', 'video', 'file', 'link', 'text'], example: 'image' })
  type!: ResolvedAsset['type'];

  @ApiProperty({ enum: ['gcs', 'url', 'emoji', 'text'], example: 'gcs' })
  source!: ResolvedAsset['source'];

  @ApiProperty({
    description: 'objectKey (GCS) | URL | emoji char | plain text',
    example: 'avatars/user-uuid/photo.jpg',
  })
  target!: string;

  @ApiProperty({ example: 120400, nullable: true, required: false })
  fileSize?: number;

  @ApiProperty({ example: true })
  isPublic!: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({
    description: 'Ready-to-use URL for <img src> or <a href>',
    example: 'https://storage.googleapis.com/chamuco-uploads/avatars/user-uuid/photo.jpg',
  })
  url!: string;

  @ApiProperty({
    description: 'Signed URL expiry. Only present for private GCS assets.',
    example: '2026-01-08T00:00:00.000Z',
    nullable: true,
    required: false,
  })
  expiresAt?: string;
}

export class UserResponseDto {
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

  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.PRIVATE })
  profileVisibility!: ProfileVisibility;

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
