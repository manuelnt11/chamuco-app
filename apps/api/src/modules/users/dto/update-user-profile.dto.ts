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

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'John', minLength: 2, maxLength: 100, required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Doe', minLength: 2, maxLength: 100, required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
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

  @ApiProperty({ example: 'Bogotá', nullable: true, required: false })
  @IsOptional()
  @IsString()
  birthCity?: string | null;

  @ApiProperty({
    example: 'CO',
    description: 'ISO 3166-1 alpha-2 country code (two uppercase letters).',
    required: false,
  })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'homeCountry must be a 2-letter uppercase ISO country code' })
  homeCountry?: string;

  @ApiProperty({ example: 'Medellín', nullable: true, required: false })
  @IsOptional()
  @IsString()
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

  @ApiProperty({ example: 'Travel enthusiast.', nullable: true, required: false })
  @IsOptional()
  @IsString()
  bio?: string | null;
}
