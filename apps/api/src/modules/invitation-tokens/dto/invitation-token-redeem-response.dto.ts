import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InvitationTokenContext,
  INVITATION_TOKEN_REDEMPTION_OUTCOMES,
} from '@chamuco/shared-types';
import type {
  InvitationTokenRedeemResponse,
  InvitationTokenRedemptionOutcome,
} from '@chamuco/shared-types';

export class InvitationTokenRedeemResponseDto implements InvitationTokenRedeemResponse {
  @ApiProperty({ enum: INVITATION_TOKEN_REDEMPTION_OUTCOMES })
  outcome: InvitationTokenRedemptionOutcome = 'INVITED';

  @ApiProperty({ enum: InvitationTokenContext })
  contextType: InvitationTokenContext = InvitationTokenContext.REFERRAL;

  @ApiPropertyOptional({ type: String, nullable: true })
  contextId: string | null = null;
}
