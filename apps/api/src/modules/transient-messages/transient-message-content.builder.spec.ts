import { TransientMessageType } from '@chamuco/shared-types';
import { buildTransientContent } from './transient-message-content.builder';

describe('buildTransientContent()', () => {
  describe('EMAIL_VERIFICATION', () => {
    it('includes code in body', () => {
      const result = buildTransientContent(TransientMessageType.EMAIL_VERIFICATION, {
        code: '123456',
      });
      expect(result.subject).toBe('Verify your email address');
      expect(result.body).toContain('123456');
    });

    it('handles missing code', () => {
      const result = buildTransientContent(TransientMessageType.EMAIL_VERIFICATION, {});
      expect(result.body).toBeTruthy();
    });
  });

  describe('PHONE_VERIFICATION', () => {
    it('includes code in body', () => {
      const result = buildTransientContent(TransientMessageType.PHONE_VERIFICATION, {
        code: '847291',
      });
      expect(result.subject).toBe('Chamuco verification code');
      expect(result.body).toContain('847291');
    });

    it('handles missing code', () => {
      const result = buildTransientContent(TransientMessageType.PHONE_VERIFICATION, {});
      expect(result.body).toBeTruthy();
    });
  });

  describe('WELCOME_EMAIL', () => {
    it('includes displayName in body', () => {
      const result = buildTransientContent(TransientMessageType.WELCOME_EMAIL, {
        displayName: 'Manuel',
      });
      expect(result.subject).toBe('Welcome to Chamuco Travel!');
      expect(result.body).toContain('Manuel');
    });

    it('falls back when displayName missing', () => {
      const result = buildTransientContent(TransientMessageType.WELCOME_EMAIL, {});
      expect(result.body).toContain('there');
    });
  });
});
