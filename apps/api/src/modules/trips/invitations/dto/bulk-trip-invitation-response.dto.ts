import { ApiProperty } from '@nestjs/swagger';
import { type BulkInvitationResponse } from '@chamuco/shared-types';

import { InvitationResultDto } from '@/common/dto/invitation-result.dto';

export class BulkTripInvitationResponseDto implements BulkInvitationResponse {
  @ApiProperty({ type: [InvitationResultDto] })
  results!: InvitationResultDto[];
}
