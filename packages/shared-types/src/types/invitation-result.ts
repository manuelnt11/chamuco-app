export const INVITATION_RESULT_STATUSES = [
  'INVITED',
  'ALREADY_MEMBER',
  'ALREADY_INVITED',
  'HAS_PENDING_REQUEST',
  'NOT_FOUND',
] as const;

export type InvitationResultStatus = (typeof INVITATION_RESULT_STATUSES)[number];

export interface InvitationResult {
  username: string;
  status: InvitationResultStatus;
}

export interface BulkInvitationResponse {
  results: InvitationResult[];
}
