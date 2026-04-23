import 'reflect-metadata';
import { validate } from '@/config/environment.schema';

const baseEnv = {
  NODE_ENV: 'development',
  FIREBASE_SERVICE_ACCOUNT_JSON: '{}',
  GEONAMES_USERNAME: 'testuser',
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

    it('accepts comma-separated https URLs', () => {
      expect(() =>
        validate({
          ...baseEnv,
          CORS_ORIGIN: 'https://chamucotravel.com,https://www.chamucotravel.com',
        }),
      ).not.toThrow();
    });

    it('rejects comma-separated URLs where any lacks protocol', () => {
      expect(() =>
        validate({
          ...baseEnv,
          CORS_ORIGIN: 'https://chamucotravel.com,www.chamucotravel.com',
        }),
      ).toThrow('Environment validation failed');
    });
  });
});
