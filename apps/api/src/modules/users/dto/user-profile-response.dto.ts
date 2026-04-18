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

  @ApiProperty({ example: '+573001234567' })
  phoneNumber!: string;

  @ApiProperty({ example: 'Travel enthusiast.', nullable: true })
  bio!: string | null;
}
