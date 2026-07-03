import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationTokenContext } from '@chamuco/shared-types';

export class CreateInvitationTokenDto {
  @ApiProperty({ enum: InvitationTokenContext, description: 'Context type for the invitation' })
  @IsEnum(InvitationTokenContext)
  contextType: InvitationTokenContext = InvitationTokenContext.REFERRAL;

  @ApiPropertyOptional({
    type: String,
    description: 'UUID of the trip or group. Required for trip and group contexts.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  contextId?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Email address for a targeted link. Omit for an open link. ' +
      'The email must not already belong to a registered user.',
    example: 'friend@example.com',
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Optional personal message included in the invitation email (targeted links only).',
    maxLength: 500,
    example: '¡Únete a nuestro viaje a Cartagena!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
