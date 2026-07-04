import { ApiProperty } from '@nestjs/swagger';
import type { InvitationTokenCreateResponse } from '@chamuco/shared-types';

export class InvitationTokenCreateResponseDto implements InvitationTokenCreateResponse {
  @ApiProperty({ description: 'The raw token string (URL-safe, 43 chars)' })
  token: string = '';

  @ApiProperty({ description: 'Full shareable URL (frontend join page)' })
  url: string = '';

  @ApiProperty({ description: 'Whether the link is currently active' })
  isActive: boolean = true;
}
