import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM registration token for the device.',
    example: 'fGXk3m2...',
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @ApiPropertyOptional({
    description: 'Short device hint to help identify the token (e.g. browser UA snippet).',
    example: 'Chrome 124 / macOS',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceHint?: string;
}
