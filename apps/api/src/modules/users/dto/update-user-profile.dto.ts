import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DateOfBirthDto } from './date-of-birth.dto';
import { sanitizeProperNoun } from '@/common/transforms/proper-noun.transform';

export class UpdateUserProfileDto {
  @ApiProperty({
    example: 'JUAN CARLOS',
    description: 'Given name(s). Uppercase only, accents allowed, no digits or symbols.',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeProperNoun(value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message:
      'firstName must contain only letters and spaces (accents allowed, no digits or symbols)',
  })
  firstName?: string;

  @ApiProperty({
    example: 'GARCÍA LÓPEZ',
    description: 'Surname(s). Uppercase only, accents allowed, no digits or symbols.',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeProperNoun(value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message:
      'lastName must contain only letters and spaces (accents allowed, no digits or symbols)',
  })
  lastName?: string;

  @ApiProperty({ type: DateOfBirthDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateOfBirthDto)
  dateOfBirth?: DateOfBirthDto;

  @ApiProperty({
    example: 'CO',
    description: 'ISO 3166-1 alpha-2 country code (two uppercase letters). Null clears the field.',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'birthCountry must be a 2-letter uppercase ISO country code' })
  birthCountry?: string | null;

  @ApiProperty({
    example: 'BOGOTÁ',
    description: 'City of birth. Uppercase only, accents allowed, no digits or symbols.',
    nullable: true,
    required: false,
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeProperNoun(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message:
      'birthCity must contain only letters and spaces (accents allowed, no digits or symbols)',
  })
  birthCity?: string | null;

  @ApiProperty({
    example: 'CO',
    description: 'ISO 3166-1 alpha-2 country code (two uppercase letters).',
    required: false,
  })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'homeCountry must be a 2-letter uppercase ISO country code' })
  homeCountry?: string;

  @ApiProperty({
    example: 'MEDELLÍN',
    description: 'Home city. Uppercase only, accents allowed, no digits or symbols.',
    nullable: true,
    required: false,
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeProperNoun(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message:
      'homeCity must contain only letters and spaces (accents allowed, no digits or symbols)',
  })
  homeCity?: string | null;

  @ApiProperty({
    example: '+57',
    description:
      'Phone country code in E.164 format (e.g. +57, +1, +593). ' +
      'Must start with + followed by 1–3 digits. Frontend must enforce this format.',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+[1-9]\d{0,2}$/, {
    message: 'phoneCountryCode must be a valid country code (e.g. +57, +1, +593)',
  })
  phoneCountryCode?: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Local phone number without country code — digits only, 4–14 digits.',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{4,14}$/, {
    message: 'phoneLocalNumber must contain 4–14 digits with no spaces or symbols',
  })
  phoneLocalNumber?: string;

  @ApiProperty({ example: 'Travel enthusiast.', maxLength: 200, nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string | null;
}
