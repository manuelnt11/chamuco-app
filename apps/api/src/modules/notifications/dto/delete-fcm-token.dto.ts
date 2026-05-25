import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteFcmTokenDto {
  @ApiProperty({
    description: 'FCM registration token to remove.',
    example: 'fGXk3m2...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
