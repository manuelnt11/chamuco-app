import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LoyaltyProgramDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Client-generated UUID',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    example: 'LifeMiles',
    description: 'Name of the loyalty program (e.g. LifeMiles, Delta SkyMiles, Marriott Bonvoy)',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  programName!: string;

  @ApiProperty({
    example: 'ABC123456',
    description: 'Membership / account number for this program',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  memberId!: string;

  @ApiProperty({
    example: 'Gold tier, expires 2027-12',
    description: 'Free-form notes (tier level, expiry, etc.). Omit or set null to leave empty.',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  notes?: string | null;
}

export class UpdateLoyaltyProgramDto extends PartialType(
  OmitType(LoyaltyProgramDto, ['id'] as const),
) {}
