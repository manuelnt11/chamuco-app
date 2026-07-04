import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationTokenContext } from '@chamuco/shared-types';
import type { InvitationTokenResolveResponse } from '@chamuco/shared-types';

export class InvitationTokenResolveResponseDto implements InvitationTokenResolveResponse {
  @ApiProperty()
  token: string = '';

  @ApiProperty({ enum: InvitationTokenContext })
  contextType: InvitationTokenContext = InvitationTokenContext.REFERRAL;

  @ApiPropertyOptional({ type: String, nullable: true })
  contextId: string | null = null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Trip or group name' })
  contextName: string | null = null;

  @ApiProperty()
  createdByDisplayName: string = '';

  @ApiProperty()
  createdByUsername: string = '';

  @ApiPropertyOptional({ type: String, nullable: true })
  note: string | null = null;

  @ApiProperty()
  isActive: boolean = true;

  @ApiProperty()
  createdAt: string = '';
}
