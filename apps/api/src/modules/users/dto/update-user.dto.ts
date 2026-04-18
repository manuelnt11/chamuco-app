import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsTimeZone, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiProperty({
    example: 'America/Bogota',
    required: false,
  })
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
