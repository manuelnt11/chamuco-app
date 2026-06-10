import { ApiProperty } from '@nestjs/swagger';
import { DateOfBirthDto } from './date-of-birth.dto';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ type: DateOfBirthDto })
  dateOfBirth!: DateOfBirthDto;

  @ApiProperty({ example: 'CO', nullable: true })
  birthCountry!: string | null;

  @ApiProperty({ example: 'Bogotá', nullable: true })
  birthCity!: string | null;

  @ApiProperty({ example: 'CO' })
  homeCountry!: string;

  @ApiProperty({ example: 'Medellín', nullable: true })
  homeCity!: string | null;

  @ApiProperty({ example: 'notifications@example.com' })
  email!: string;

  @ApiProperty({ example: false })
  emailVerified!: boolean;

  @ApiProperty({ example: '+57', description: 'Phone country code (e.g. +57, +1, +593)' })
  phoneCountryCode!: string;

  @ApiProperty({ example: '3001234567', description: 'Local phone number — digits only' })
  phoneLocalNumber!: string;

  @ApiProperty({ example: false })
  phoneVerified!: boolean;

  @ApiProperty({ example: 'Travel enthusiast.', nullable: true })
  bio!: string | null;
}
