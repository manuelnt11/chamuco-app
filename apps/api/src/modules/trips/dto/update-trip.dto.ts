import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { TripVisibility } from '@chamuco/shared-types';
import { TripCoverDto } from './trip-cover.dto';
import {
  sanitizeName,
  sanitizeProperNoun,
  sanitizeUpperCase,
} from '@/common/transforms/name.transform';

export class UpdateTripDto {
  @ApiProperty({ required: false, description: 'Trip name', minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => sanitizeName(value))
  name?: string;

  @ApiProperty({ required: false, description: 'Trip description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, enum: TripVisibility })
  @IsOptional()
  @IsEnum(TripVisibility)
  visibility?: TripVisibility;

  @ApiProperty({
    required: false,
    description: 'Trip start date (YYYY-MM-DD)',
    example: '2026-12-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'Trip end date (YYYY-MM-DD)',
    example: '2026-12-08',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Max traveling participants. ≥ 1.', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  participantCapacity?: number;

  @ApiProperty({
    required: false,
    description: 'ISO 3166-1 alpha-2 departure country.',
    example: 'MX',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => sanitizeUpperCase(value))
  departureCountry?: string;

  @ApiProperty({ required: false, description: 'Departure city.', example: 'CIUDAD DE MEXICO' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'departureCity must contain only letters and spaces (accents allowed)',
  })
  @Transform(({ value }) => sanitizeProperNoun(value))
  departureCity?: string;

  @ApiProperty({
    required: false,
    description: 'ISO 3166-1 alpha-2 landing country.',
    example: 'MX',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => sanitizeUpperCase(value))
  landingCountry?: string;

  @ApiProperty({ required: false, description: 'Landing city.', example: 'CANCUN' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'landingCity must contain only letters and spaces (accents allowed)',
  })
  @Transform(({ value }) => sanitizeProperNoun(value))
  landingCity?: string;

  @ApiProperty({
    required: false,
    description: 'Default timezone (IANA).',
    example: 'America/Cancun',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  defaultTimezone?: string;

  @ApiProperty({
    required: false,
    description: 'Default currency (ISO 4217, 3-char).',
    example: 'MXN',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => sanitizeUpperCase(value))
  defaultCurrency?: string;

  @ApiProperty({ required: false, description: 'Itinerary notes.' })
  @IsOptional()
  @IsString()
  itineraryNotes?: string;

  @ApiProperty({
    required: false,
    description:
      'Cover for the trip. Use source=emoji for an emoji cover or source=gcs after uploading via POST /v1/uploads/signed-url.',
    type: TripCoverDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TripCoverDto)
  cover?: TripCoverDto;
}
