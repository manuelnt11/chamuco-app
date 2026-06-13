import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const FIVE_MB = 5 * 1024 * 1024;

export class TripCoverDto {
  @ApiProperty({
    description: 'Storage backend for the trip cover',
    enum: ['gcs', 'emoji'],
    example: 'emoji',
  })
  @IsIn(['gcs', 'emoji'])
  source!: 'gcs' | 'emoji';

  @ApiProperty({
    description:
      'For gcs: objectKey from POST /v1/uploads/signed-url. ' +
      'For emoji: the emoji character (e.g. "🏝️"), max 8 chars.',
    example: '🏝️',
  })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: TripCoverDto) => o.source === 'emoji')
  @MaxLength(8)
  target!: string;

  @ApiProperty({
    description: 'File size in bytes. Required when source is gcs.',
    example: 512000,
    required: false,
    minimum: 1,
    maximum: FIVE_MB,
  })
  @ValidateIf((o: TripCoverDto) => o.source === 'gcs')
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(FIVE_MB)
  fileSize?: number;
}
