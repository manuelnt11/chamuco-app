import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteFcmTokenDto {
  @ApiProperty({
    description: 'FCM registration token to remove.',
    example: 'fGXk3m2...',
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;
}
