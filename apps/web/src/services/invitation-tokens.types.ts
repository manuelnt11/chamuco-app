import type { InvitationTokenContext } from '@chamuco/shared-types';

export interface CreateInvitationTokenPayload {
  contextType: InvitationTokenContext;
  contextId?: string;
  recipientEmail?: string;
  note?: string;
}
