import 'reflect-metadata';
import { validate } from '@/config/environment.schema';

const baseEnv = {
  NODE_ENV: 'development',
  FIREBASE_SERVICE_ACCOUNT_JSON: '{}',
};

describe('environment.schema — validate()', () => {
  describe('CORS_ORIGIN', () => {
    it('accepts a valid https URL', () => {
      expect(() =>
        validate({ ...baseEnv, CORS_ORIGIN: 'https://chamucotravel.com' }),
      ).not.toThrow();
    });

    it('accepts undefined (local dev, no restriction)', () => {
      expect(() => validate(baseEnv)).not.toThrow();
    });

    it('rejects a value without protocol', () => {
      expect(() => validate({ ...baseEnv, CORS_ORIGIN: 'chamucotravel.com' })).toThrow(
        'Environment validation failed',
      );
    });

    it('rejects a plain string that is not a URL', () => {
      expect(() => validate({ ...baseEnv, CORS_ORIGIN: 'not-a-url' })).toThrow(
        'Environment validation failed',
      );
    });
  });
});
