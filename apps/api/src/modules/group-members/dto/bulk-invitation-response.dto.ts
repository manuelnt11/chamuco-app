import { ApiProperty } from '@nestjs/swagger';

export const INVITATION_RESULT_STATUSES = [
  'INVITED',
  'ALREADY_MEMBER',
  'ALREADY_INVITED',
  'HAS_PENDING_REQUEST',
  'NOT_FOUND',
] as const;

export type InvitationResultStatus = (typeof INVITATION_RESULT_STATUSES)[number];

export class InvitationResultDto {
  @ApiProperty({ example: 'john_doe' })
  username!: string;

  @ApiProperty({
    enum: INVITATION_RESULT_STATUSES,
    example: 'INVITED',
    description:
      'INVITED — sent successfully. ' +
      'ALREADY_MEMBER — active member. ' +
      'ALREADY_INVITED — pending invitation. ' +
      'HAS_PENDING_REQUEST — has an active join request. ' +
      'NOT_FOUND — username does not exist.',
  })
  status!: InvitationResultStatus;
}

export class BulkInvitationResponseDto {
  @ApiProperty({ type: [InvitationResultDto] })
  results!: InvitationResultDto[];
}
