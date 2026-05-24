import { TransientMessageType } from '@chamuco/shared-types';
import { buildTransientContent } from './transient-message-content.builder';

describe('buildTransientContent()', () => {
  it('covers all TransientMessageType values without throwing', () => {
    for (const type of Object.values(TransientMessageType)) {
      expect(() => buildTransientContent(type, {})).not.toThrow();
    }
  });

  it('derives i18n keys from the transient message type', () => {
    const result = buildTransientContent(TransientMessageType.EMAIL_VERIFICATION, {});
    expect(result.subjectKey).toBe('transient.emailVerification.subject');
    expect(result.bodyKey).toBe('transient.emailVerification.body');
  });

  it('EMAIL_VERIFICATION — passes code arg', () => {
    const result = buildTransientContent(TransientMessageType.EMAIL_VERIFICATION, {
      code: '123456',
    });
    expect(result.args['code']).toBe('123456');
  });

  it('PHONE_VERIFICATION — derives correct keys', () => {
    const result = buildTransientContent(TransientMessageType.PHONE_VERIFICATION, {
      code: '847291',
    });
    expect(result.subjectKey).toBe('transient.phoneVerification.subject');
    expect(result.bodyKey).toBe('transient.phoneVerification.body');
    expect(result.args['code']).toBe('847291');
  });

  it('WELCOME_EMAIL — passes displayName arg', () => {
    const result = buildTransientContent(TransientMessageType.WELCOME_EMAIL, {
      displayName: 'Manuel',
    });
    expect(result.subjectKey).toBe('transient.welcomeEmail.subject');
    expect(result.args['displayName']).toBe('Manuel');
  });

  it('strips non-string/non-number/non-boolean payload values from args', () => {
    const result = buildTransientContent(TransientMessageType.WELCOME_EMAIL, {
      meta: { nested: true },
      email: 'user@example.com',
    });
    expect(result.args).toEqual({ email: 'user@example.com' });
  });

  it('returns empty args when payload is empty', () => {
    const result = buildTransientContent(TransientMessageType.WELCOME_EMAIL, {});
    expect(result.args).toEqual({});
  });
});
