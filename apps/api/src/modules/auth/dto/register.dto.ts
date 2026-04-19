import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DateOfBirthDto } from '@/modules/users/dto/date-of-birth.dto';
import { CreateNationalityDto } from '@/modules/users/dto/nationality.dto';
import { EmergencyContactDto } from '@/modules/users/dto/emergency-contact.dto';
import { IsMinimumAge } from '@/modules/users/dto/minimum-age.validator';

export class RegisterDto {
  @ApiProperty({
    description:
      'Unique username for the new account. Lowercase letters, numbers, underscores, and dashes only.',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-z0-9_-]{3,30}$',
  })
  @IsString()
  @Matches(/^[a-z0-9_-]{3,30}$/, {
    message:
      'username must be 3–30 characters and contain only lowercase letters, numbers, underscores, and dashes',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  username!: string;

  @ApiProperty({
    description:
      'Display name for the account. Pre-filled from the OAuth provider but editable by the user at registration.',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  displayName!: string;

  @ApiProperty({
    description:
      'Given name(s) as they appear on travel documents. Stored in uppercase — may include two given names separated by a space (e.g. "JUAN CARLOS").',
    example: 'JUAN CARLOS',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  // Uppercase normalization: travel forms (visas, airlines, passports) require all-caps names.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  firstName!: string;

  @ApiProperty({
    description:
      'Surname(s) as they appear on travel documents. Stored in uppercase — may include two surnames separated by a space (e.g. "GARCÍA LÓPEZ").',
    example: 'GARCÍA LÓPEZ',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  // Uppercase normalization: travel forms (visas, airlines, passports) require all-caps names.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  lastName!: string;

  @ApiProperty({
    type: () => DateOfBirthDto,
    description: 'Date of birth. Must be at least 16 years old.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DateOfBirthDto)
  @IsMinimumAge(16)
  dateOfBirth!: DateOfBirthDto;

  @ApiProperty({
    example: 'CO',
    description: 'ISO 3166-1 alpha-2 home country code (two uppercase letters)',
  })
  @Matches(/^[A-Z]{2}$/, { message: 'homeCountry must be a 2-letter uppercase ISO country code' })
  homeCountry!: string;

  @ApiProperty({
    example: 'MEDELLÍN',
    required: false,
    maxLength: 100,
    description: 'Home city. Stored in uppercase to match travel document conventions.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  homeCity?: string;

  @ApiProperty({
    example: '+57',
    description: 'Phone country code in E.164 format (e.g. +57, +1, +593)',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{0,2}$/, {
    message: 'phoneCountryCode must be a valid country code (e.g. +57, +1, +593)',
  })
  phoneCountryCode!: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Local phone number without country code — digits only, 4–14 digits.',
  })
  @IsString()
  @Matches(/^\d{4,14}$/, {
    message: 'phoneLocalNumber must contain 4–14 digits with no spaces or symbols',
  })
  phoneLocalNumber!: string;

  @ApiProperty({
    type: () => [CreateNationalityDto],
    required: false,
    description:
      'Optional list of nationalities. If provided, must have at least one entry and exactly one with isPrimary: true.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateNationalityDto)
  nationalities?: CreateNationalityDto[];

  @ApiProperty({
    type: () => [EmergencyContactDto],
    required: false,
    description:
      'Optional list of emergency contacts. If provided, must have at least one entry and exactly one with isPrimary: true.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];
}
