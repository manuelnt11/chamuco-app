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
    example: '+573001234567',
    description:
      'Phone number in E.164 format (e.g. +573001234567). ' +
      'Must start with + followed by country code and subscriber number (max 15 digits total). ' +
      'Frontend must enforce this format before submitting.',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid E.164 number (e.g. +573001234567)',
  })
  phoneNumber?: string;

  @ApiProperty({ example: 'Travel enthusiast.', nullable: true, required: false })
  @IsOptional()
  @IsString()
  bio?: string | null;
}
