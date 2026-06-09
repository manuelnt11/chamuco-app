import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { TripVisibility } from '@chamuco/shared-types';
import {
  sanitizeName,
  sanitizeProperNoun,
  sanitizeUpperCase,
} from '@/common/transforms/name.transform';

@ValidatorConstraint({ name: 'isAfterOrEqualStartDate', async: false })
class IsAfterOrEqualStartDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return true;
    const obj = args.object as Record<string, unknown>;
    const startDate = obj['startDate'];
    if (typeof startDate !== 'string') return true;
    return value >= startDate;
  }

  defaultMessage(): string {
    return 'endDate must be on or after startDate';
  }
}

function IsAfterOrEqualStartDate(options?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options,
      constraints: [],
      validator: IsAfterOrEqualStartDateConstraint,
    });
  };
}

export class CreateTripDto {
  @ApiProperty({ description: 'Trip name', example: 'Cancún 2026', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => sanitizeName(value))
  name!: string;

  @ApiProperty({
    description: 'Optional trip description',
    example: 'Beach trip for the whole crew.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: TripVisibility, example: TripVisibility.PUBLIC })
  @IsEnum(TripVisibility)
  visibility!: TripVisibility;

  @ApiProperty({ description: 'Trip start date (YYYY-MM-DD)', example: '2026-12-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Trip end date (YYYY-MM-DD). Must be on or after startDate.',
    example: '2026-12-08',
  })
  @IsDateString()
  @IsAfterOrEqualStartDate()
  endDate!: string;

  @ApiProperty({
    description: 'Maximum number of traveling participants. Must be ≥ 1.',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  participantCapacity!: number;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 departure country code (uppercase).',
    example: 'MX',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => sanitizeUpperCase(value))
  departureCountry!: string;

  @ApiProperty({ description: 'Departure city name.', example: 'CIUDAD DE MEXICO' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'departureCity must contain only letters and spaces (accents allowed)',
  })
  @Transform(({ value }) => sanitizeProperNoun(value))
  departureCity!: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 landing country code (uppercase).',
    example: 'MX',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => sanitizeUpperCase(value))
  landingCountry!: string;

  @ApiProperty({ description: 'Landing city name.', example: 'CANCUN' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'landingCity must contain only letters and spaces (accents allowed)',
  })
  @Transform(({ value }) => sanitizeProperNoun(value))
  landingCity!: string;

  @ApiProperty({
    description: 'Default timezone for the trip (IANA format).',
    example: 'America/Cancun',
    required: false,
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  defaultTimezone?: string;

  @ApiProperty({
    description: 'Default currency (ISO 4217, 3-char uppercase).',
    example: 'MXN',
    required: false,
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => sanitizeUpperCase(value))
  defaultCurrency?: string;

  @ApiProperty({
    description: 'Optional itinerary notes.',
    required: false,
  })
  @IsOptional()
  @IsString()
  itineraryNotes?: string;

  @ApiProperty({
    description:
      'Whether the organizer is a traveling participant. Determines if they count toward participantCapacity.',
    example: true,
  })
  @IsBoolean()
  isTravelingParticipant!: boolean;
}
