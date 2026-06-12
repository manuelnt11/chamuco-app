import { ApiProperty } from '@nestjs/swagger';
import {
  INVITATION_RESULT_STATUSES,
  type InvitationResult,
  type BulkInvitationResponse,
} from '@chamuco/shared-types';

export class InvitationResultDto implements InvitationResult {
  @ApiProperty({ example: 'john_doe' })
  username!: string;

  @ApiProperty({
    enum: INVITATION_RESULT_STATUSES,
    enumName: 'InvitationResultStatus',
    example: 'INVITED',
    description:
      'INVITED — sent successfully. ' +
      'ALREADY_MEMBER — active member. ' +
      'ALREADY_INVITED — pending invitation. ' +
      'HAS_PENDING_REQUEST — has an active join request. ' +
      'NOT_FOUND — username does not exist.',
  })
  status!: InvitationResult['status'];
}

export class BulkInvitationResponseDto implements BulkInvitationResponse {
  @ApiProperty({ type: [InvitationResultDto] })
  results!: InvitationResultDto[];
}
