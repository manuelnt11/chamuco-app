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
