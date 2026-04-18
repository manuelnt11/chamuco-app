import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DateOfBirthDto } from './date-of-birth.dto';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'John', maxLength: 100, required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Doe', maxLength: 100, required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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

  @ApiProperty({ example: '+573001234567', maxLength: 30, required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiProperty({ example: 'Travel enthusiast.', nullable: true, required: false })
  @IsOptional()
  @IsString()
  bio?: string | null;
}
