import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Usernames to invite (without @). 1–20 per request.',
    example: ['juan_viajero', 'maria_explorer'],
    type: [String],
    minLength: 3,
    maxLength: 30,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(30, { each: true })
  @Matches(/^[a-z0-9_-]+$/, {
    each: true,
    message: 'each username must contain only lowercase letters, digits, underscores, and dashes',
  })
  usernames!: string[];
}
