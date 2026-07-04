import type { InvitationTokenContext } from '../enums/invitation-token-context.enum';

export interface InvitationTokenRedeemer {
  who: string;
  at: string;
}

export interface InvitationTokenCreateResponse {
  token: string;
  url: string;
  isActive: boolean;
}

export interface InvitationTokenResolveResponse {
  token: string;
  contextType: InvitationTokenContext;
  contextId: string | null;
  contextName: string | null;
  createdByDisplayName: string;
  createdByUsername: string;
  note: string | null;
  isActive: boolean;
  createdAt: string;
}

export const INVITATION_TOKEN_REDEMPTION_OUTCOMES = [
  'INVITED',
  'REQUEST_ACCEPTED',
  'ALREADY_MEMBER',
  'ALREADY_INVITED',
  'REFERRAL_RECORDED',
] as const;

export type InvitationTokenRedemptionOutcome =
  (typeof INVITATION_TOKEN_REDEMPTION_OUTCOMES)[number];

export interface InvitationTokenRedeemResponse {
  outcome: InvitationTokenRedemptionOutcome;
  contextType: InvitationTokenContext;
  contextId: string | null;
}
