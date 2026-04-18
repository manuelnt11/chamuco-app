import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PassportStatus } from '@chamuco/shared-types';

// Condition: any passport field present in the payload
const anyPassportFieldPresent = (o: {
  passportNumber?: unknown;
  passportIssueDate?: unknown;
  passportExpiryDate?: unknown;
}): boolean =>
  o.passportNumber !== undefined ||
  o.passportIssueDate !== undefined ||
  o.passportExpiryDate !== undefined;

export class NationalityResponseDto {
  @ApiProperty({
    example: 'b3c4d5e6-f7a8-9012-bcde-f01234567890',
    description: 'Server-generated UUID',
  })
  id!: string;

  @ApiProperty({ example: 'CO', description: 'ISO 3166-1 alpha-2 country code' })
  countryCode!: string;

  @ApiProperty({ example: true, description: 'Exactly one nationality must be primary' })
  isPrimary!: boolean;

  @ApiProperty({ example: '12345678', description: 'National ID / Cédula / DNI', nullable: true })
  nationalIdNumber!: string | null;

  @ApiProperty({ example: 'AB123456', description: 'Passport document number', nullable: true })
  passportNumber!: string | null;

  @ApiProperty({
    example: '2020-01-15',
    description: 'Passport issue date (YYYY-MM-DD)',
    nullable: true,
  })
  passportIssueDate!: string | null;

  @ApiProperty({
    example: '2030-01-15',
    description: 'Passport expiry date (YYYY-MM-DD)',
    nullable: true,
  })
  passportExpiryDate!: string | null;

  @ApiProperty({
    enum: PassportStatus,
    example: PassportStatus.ACTIVE,
    description: 'Computed by the server — not provided by the client',
  })
  passportStatus!: PassportStatus;
}

export class CreateNationalityDto {
  @ApiProperty({
    example: 'CO',
    description: 'ISO 3166-1 alpha-2 country code (two uppercase letters)',
  })
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter uppercase ISO country code' })
  @IsString()
  countryCode!: string;

  @ApiProperty({ example: true, description: 'Exactly one nationality must be primary' })
  @IsBoolean()
  isPrimary!: boolean;

  @ApiProperty({
    example: '12345678',
    description: 'National ID / Cédula / DNI. Omit or set null to leave empty.',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'nationalIdNumber must not be an empty string' })
  nationalIdNumber?: string | null;

  @ApiProperty({
    example: 'AB123456',
    description: 'Passport document number. Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportNumber is required when any passport field is provided' })
  @IsString()
  @IsNotEmpty({ message: 'passportNumber must not be an empty string' })
  passportNumber?: string;

  @ApiProperty({
    example: '2020-01-15',
    description: 'Passport issue date (YYYY-MM-DD). Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportIssueDate is required when any passport field is provided' })
  @IsDateString({}, { message: 'passportIssueDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  passportIssueDate?: string;

  @ApiProperty({
    example: '2030-01-15',
    description: 'Passport expiry date (YYYY-MM-DD). Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportExpiryDate is required when any passport field is provided' })
  @IsDateString({}, { message: 'passportExpiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  passportExpiryDate?: string;
}

export class UpdateNationalityDto {
  @ApiProperty({
    example: true,
    description:
      'Promote this nationality to primary. isPrimary: false is rejected — assign a new primary instead.',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({
    example: '12345678',
    description: 'National ID / Cédula / DNI. Omit to leave unchanged.',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'nationalIdNumber must not be an empty string' })
  nationalIdNumber?: string | null;

  @ApiProperty({
    example: 'AB123456',
    description: 'Passport document number. Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportNumber is required when any passport field is provided' })
  @IsString()
  @IsNotEmpty({ message: 'passportNumber must not be an empty string' })
  passportNumber?: string;

  @ApiProperty({
    example: '2020-01-15',
    description: 'Passport issue date (YYYY-MM-DD). Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportIssueDate is required when any passport field is provided' })
  @IsDateString({}, { message: 'passportIssueDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  passportIssueDate?: string;

  @ApiProperty({
    example: '2030-01-15',
    description: 'Passport expiry date (YYYY-MM-DD). Required when any passport field is provided.',
    required: false,
  })
  @ValidateIf(anyPassportFieldPresent)
  @IsDefined({ message: 'passportExpiryDate is required when any passport field is provided' })
  @IsDateString({}, { message: 'passportExpiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  passportExpiryDate?: string;
}
