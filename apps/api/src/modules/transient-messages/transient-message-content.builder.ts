import { TransientMessageType } from '@chamuco/shared-types';

type ContentBuilder = (payload: Record<string, unknown>) => { subject: string; body: string };

const CONTENT_BUILDERS: Record<TransientMessageType, ContentBuilder> = {
  [TransientMessageType.EMAIL_VERIFICATION]: (p) => ({
    subject: 'Verify your email address',
    body: `Your verification code is: ${String(p['code'] ?? '')}`,
  }),
  [TransientMessageType.PHONE_VERIFICATION]: (p) => ({
    subject: 'Chamuco verification code',
    body: `Your verification code is: ${String(p['code'] ?? '')}`,
  }),
  [TransientMessageType.WELCOME_EMAIL]: (p) => ({
    subject: 'Welcome to Chamuco Travel!',
    body: `Hi ${String(p['displayName'] ?? 'there')}, welcome to Chamuco Travel!`,
  }),
};

export function buildTransientContent(
  type: TransientMessageType,
  payload: Record<string, unknown>,
): { subject: string; body: string } {
  return CONTENT_BUILDERS[type](payload);
}
