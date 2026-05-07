import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const TWO_MB = 2 * 1024 * 1024;

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'Storage backend for the new avatar',
    enum: ['gcs', 'emoji'],
    example: 'gcs',
  })
  @IsIn(['gcs', 'emoji'])
  source!: 'gcs' | 'emoji';

  @ApiProperty({
    description:
      'For gcs: objectKey from POST /v1/uploads/signed-url. ' +
      'For emoji: the emoji character (e.g. "😀"), max 8 chars.',
    example: 'avatars/user-uuid/photo.jpg',
  })
  // @IsString and @IsNotEmpty apply unconditionally (both sources require a non-empty string).
  // @MaxLength(8) applies only for source='emoji' via @ValidateIf.
  // GCS objectKeys are not validated beyond IsString/IsNotEmpty; prefix trust delegated to
  // the signed-URL flow (POST /v1/uploads/signed-url enforces allowed prefixes at issue time).
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: UpdateAvatarDto) => o.source === 'emoji')
  @MaxLength(8)
  target!: string;

  @ApiProperty({
    description: 'File size in bytes. Required when source is gcs.',
    example: 120400,
    required: false,
    minimum: 1,
    maximum: TWO_MB,
  })
  @ValidateIf((o: UpdateAvatarDto) => o.source === 'gcs')
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(TWO_MB)
  fileSize?: number;
}
