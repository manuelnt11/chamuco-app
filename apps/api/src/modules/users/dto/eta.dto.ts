import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { DocumentStatus, EtaType, VisaEntries } from '@chamuco/shared-types';
import { DOCUMENT_ID_FORMAT_REGEX } from '@chamuco/shared-utils';

export class EtaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'b3c4d5e6-f7a8-9012-bcde-f01234567890' })
  userNationalityId!: string;

  @ApiProperty({ example: 'AB123456', description: 'Passport number snapshot at ETA creation' })
  passportNumber!: string;

  @ApiProperty({ example: 'US', description: 'ISO 3166-1 alpha-2 destination country' })
  destinationCountry!: string;

  @ApiProperty({ example: 'A1B2C3D4E5', description: 'Official authorization number' })
  authorizationNumber!: string;

  @ApiProperty({ enum: EtaType, example: EtaType.TOURIST })
  etaType!: EtaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.MULTIPLE })
  entries!: VisaEntries;

  @ApiProperty({ example: '2027-12-31', description: 'ETA expiry date (YYYY-MM-DD)' })
  expiryDate!: string;

  @ApiProperty({
    enum: DocumentStatus,
    example: DocumentStatus.ACTIVE,
    description: 'Computed by the server. Also set to EXPIRED when the linked passport is renewed.',
  })
  etaStatus!: DocumentStatus;

  @ApiProperty({ example: 'Max 90 days per stay', nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

export class CreateEtaDto {
  @ApiProperty({
    example: 'AB123456',
    description:
      'Passport number this ETA was issued for. Snapshotted — changing the passport later will automatically expire this ETA.',
  })
  @IsString()
  @IsNotEmpty({ message: 'passportNumber must not be an empty string' })
  passportNumber!: string;

  @ApiProperty({
    example: 'US',
    description: 'ISO 3166-1 alpha-2 destination country (two uppercase letters)',
  })
  @Matches(/^[A-Z]{2}$/, {
    message: 'destinationCountry must be a 2-letter uppercase ISO country code',
  })
  destinationCountry!: string;

  @ApiProperty({ example: 'A1B2C3D4E5', description: 'Official authorization reference number' })
  @IsString()
  @IsNotEmpty({ message: 'authorizationNumber must not be an empty string' })
  @Matches(DOCUMENT_ID_FORMAT_REGEX, {
    message:
      'authorizationNumber must contain only uppercase letters, numbers, and hyphens, and must not start or end with a hyphen',
  })
  authorizationNumber!: string;

  @ApiProperty({ enum: EtaType, example: EtaType.TOURIST })
  @IsEnum(EtaType)
  etaType!: EtaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.MULTIPLE })
  @IsEnum(VisaEntries)
  entries!: VisaEntries;

  @ApiProperty({ example: '2027-12-31', description: 'ETA expiry date (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'expiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  expiryDate!: string;

  @ApiProperty({
    example: 'Max 90 days per stay',
    description: 'Free text: approved stay duration, restrictions, etc.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes must not be an empty string' })
  notes?: string | null;
}

export class UpdateEtaDto {
  @ApiProperty({ example: 'B2C3D4E5F6', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'authorizationNumber must not be an empty string' })
  @Matches(DOCUMENT_ID_FORMAT_REGEX, {
    message:
      'authorizationNumber must contain only uppercase letters, numbers, and hyphens, and must not start or end with a hyphen',
  })
  authorizationNumber?: string;

  @ApiProperty({ enum: EtaType, example: EtaType.TRANSIT, required: false })
  @IsOptional()
  @IsEnum(EtaType)
  etaType?: EtaType;

  @ApiProperty({ enum: VisaEntries, example: VisaEntries.SINGLE, required: false })
  @IsOptional()
  @IsEnum(VisaEntries)
  entries?: VisaEntries;

  @ApiProperty({
    example: '2028-06-30',
    description: 'Updated expiry date (YYYY-MM-DD). Recomputes etaStatus.',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'expiryDate must be a valid ISO 8601 date (YYYY-MM-DD)' })
  expiryDate?: string;

  @ApiProperty({ example: 'Max 180 days per stay', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes must not be an empty string' })
  notes?: string | null;
}
