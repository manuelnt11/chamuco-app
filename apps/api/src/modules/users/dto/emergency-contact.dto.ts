import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class EmergencyContactDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Client-generated UUID',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'María López', minLength: 2, maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    example: '+57',
    description:
      'Phone country code in E.164 format (e.g. +57, +1, +593). ' +
      'Must start with + followed by 1–3 digits. Frontend must enforce this format.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+[1-9]\d{0,2}$/, {
    message: 'phoneCountryCode must be a valid country code (e.g. +57, +1, +593)',
  })
  phoneCountryCode!: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Local phone number without country code — digits only, 4–14 digits.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{4,14}$/, {
    message: 'phoneLocalNumber must contain 4–14 digits with no spaces or symbols',
  })
  phoneLocalNumber!: string;

  @ApiProperty({
    example: 'mother',
    description: 'Relationship to the user',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  relationship!: string;

  @ApiProperty({ example: true, description: 'Exactly one contact must be primary' })
  @IsBoolean()
  isPrimary!: boolean;
}

export class UpdateEmergencyContactDto extends PartialType(
  OmitType(EmergencyContactDto, ['id'] as const),
) {}
