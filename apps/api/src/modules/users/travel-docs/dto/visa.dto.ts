import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  DocumentStatus,
  VisaCoverageType,
  VisaEntries,
  VisaType,
  VisaZone,
} from '@chamuco/shared-types';

export class VisaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'b3c4d5e6-f7a8-9012-bcde-f01234567890' })
  nationalityId!: string;

  @ApiProperty({ enum: VisaCoverageType, example: VisaCoverageType.COUNTRY })
  coverageType!: VisaCoverageType;

  @ApiProperty({ example: 'US', nullable: true })
  countryCode!: string | null;

  @ApiProperty({ enum: VisaZone, example: null, nullable: true })
  visaZone!: VisaZone | null;

  @ApiProperty({ enum: VisaType, example: VisaType.TOURIST })
  visaType!: VisaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.MULTIPLE })
  entries!: VisaEntries;

  @ApiProperty({ example: '2027-12-31', description: 'Visa expiry date (YYYY-MM-DD)' })
  expiryDate!: string;

  @ApiProperty({
    enum: DocumentStatus,
    example: DocumentStatus.ACTIVE,
    description: 'Computed by the server — not provided by the client',
  })
  visaStatus!: DocumentStatus;

  @ApiProperty({ example: 'Visa number: 12345678', nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

export class CreateVisaDto {
  @ApiProperty({
    enum: VisaCoverageType,
    example: VisaCoverageType.COUNTRY,
    description: 'Determines whether countryCode or visaZone must be provided',
  })
  @IsEnum(VisaCoverageType)
  coverageType!: VisaCoverageType;

  @ApiProperty({
    example: 'US',
    description: 'ISO 3166-1 alpha-2. Required when coverageType is COUNTRY.',
    required: false,
    nullable: true,
  })
  @ValidateIf((o: CreateVisaDto) => o.coverageType === VisaCoverageType.COUNTRY)
  @IsDefined({ message: 'countryCode is required when coverageType is COUNTRY' })
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter uppercase ISO country code' })
  countryCode?: string;

  @ApiProperty({
    enum: VisaZone,
    example: null,
    description: 'Required when coverageType is ZONE.',
    required: false,
    nullable: true,
  })
  @ValidateIf((o: CreateVisaDto) => o.coverageType === VisaCoverageType.ZONE)
  @IsDefined({ message: 'visaZone is required when coverageType is ZONE' })
  @IsEnum(VisaZone)
  visaZone?: VisaZone;

  @ApiProperty({ enum: VisaType, example: VisaType.TOURIST })
  @IsEnum(VisaType)
  visaType!: VisaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.MULTIPLE })
  @IsEnum(VisaEntries)
  entries!: VisaEntries;

  @ApiProperty({ example: '2027-12-31', description: 'Visa expiry date (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'expiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  expiryDate!: string;

  @ApiProperty({
    example: 'Visa number: 12345678',
    description: 'Free text: visa number, consulate, restrictions, etc.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes must not be an empty string' })
  notes?: string | null;
}

export class UpdateVisaDto {
  @ApiProperty({ enum: VisaType, example: VisaType.BUSINESS, required: false })
  @IsOptional()
  @IsEnum(VisaType)
  visaType?: VisaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.SINGLE, required: false })
  @IsOptional()
  @IsEnum(VisaEntries)
  entries?: VisaEntries;

  @ApiProperty({
    example: '2028-06-30',
    description: 'Updated expiry date (YYYY-MM-DD). Recomputes visaStatus.',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'expiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  expiryDate?: string;

  @ApiProperty({
    example: 'Visa number: 87654321',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes must not be an empty string' })
  notes?: string | null;
}
