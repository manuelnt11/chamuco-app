import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

import { sanitizeProperNoun, sanitizeUpperCase } from '@/common/transforms/name.transform';

export class CreateDestinationDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (uppercase).',
    example: 'MX',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => sanitizeUpperCase(value))
  countryCode!: string;

  @ApiProperty({ description: 'City name.', example: 'CANCUN' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'city must contain only letters and spaces (accents allowed)',
  })
  @Transform(({ value }) => sanitizeProperNoun(value))
  city!: string;

  @ApiProperty({
    description: 'Optional short label for this stop.',
    example: 'Beach stop',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiProperty({
    description: 'Optional Markdown itinerary for this destination.',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  itinerary?: string;
}
