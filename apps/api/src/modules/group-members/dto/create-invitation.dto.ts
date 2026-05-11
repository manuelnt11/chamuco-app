import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Username of the user to invite (without @)',
    example: 'juan_viajero',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'username must contain only lowercase letters, digits, underscores, and dashes',
  })
  targetUsername!: string;
}
