import { ConfigService } from '@nestjs/config';
import { drizzleProvider, DRIZZLE_CLIENT } from './drizzle.provider';

describe('drizzleProvider', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      DATABASE_POOL_MAX: 10,
    });
  });

  describe('provider configuration', () => {
    it('should have correct provide token', () => {
      expect(drizzleProvider.provide).toBe(DRIZZLE_CLIENT);
    });

    it('should inject ConfigService', () => {
      expect(drizzleProvider.inject).toEqual([ConfigService]);
    });

    it('should have a useFactory function', () => {
      expect(drizzleProvider.useFactory).toBeDefined();
      expect(typeof drizzleProvider.useFactory).toBe('function');
    });
  });

  describe('useFactory', () => {
    it('should create a Drizzle client instance', () => {
      const client = drizzleProvider.useFactory(configService);

      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });

    it('should read DATABASE_URL from ConfigService', () => {
      const getSpy = jest.spyOn(configService, 'get');

      drizzleProvider.useFactory(configService);

      expect(getSpy).toHaveBeenCalledWith('DATABASE_URL');
    });

    it('should read DATABASE_POOL_MAX from ConfigService with default', () => {
      const getSpy = jest.spyOn(configService, 'get');

      drizzleProvider.useFactory(configService);

      expect(getSpy).toHaveBeenCalledWith('DATABASE_POOL_MAX', 10);
    });

    it('should use default pool max when not provided', () => {
      const configWithoutPool = new ConfigService({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      });

      const client = drizzleProvider.useFactory(configWithoutPool);

      expect(client).toBeDefined();
    });

    it('should handle standard PostgreSQL URL format', () => {
      const standardConfig = new ConfigService({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
        DATABASE_POOL_MAX: 5,
      });

      const client = drizzleProvider.useFactory(standardConfig);

      expect(client).toBeDefined();
    });

    it('should handle Cloud Run environment with unix socket', () => {
      // Set Cloud Run environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      const originalKService = process.env.K_SERVICE;
      const originalPgPassword = process.env.PGPASSWORD;

      process.env.NODE_ENV = 'production';
      process.env.K_SERVICE = 'test-service';
      process.env.PGPASSWORD = 'test-token';

      const cloudRunConfig = new ConfigService({
        NODE_ENV: 'production',
        DATABASE_POOL_MAX: 8,
      });

      const client = drizzleProvider.useFactory(cloudRunConfig);

      expect(client).toBeDefined();

      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;
      process.env.K_SERVICE = originalKService;
      process.env.PGPASSWORD = originalPgPassword;
    });

    it('should handle Cloud Run environment without PGPASSWORD', () => {
      // Set Cloud Run environment variables without PGPASSWORD
      const originalNodeEnv = process.env.NODE_ENV;
      const originalKService = process.env.K_SERVICE;
      const originalPgPassword = process.env.PGPASSWORD;

      process.env.NODE_ENV = 'production';
      process.env.K_SERVICE = 'test-service';
      delete process.env.PGPASSWORD; // Ensure PGPASSWORD is not set

      const cloudRunConfig = new ConfigService({
        NODE_ENV: 'production',
        DATABASE_POOL_MAX: 8,
      });

      const client = drizzleProvider.useFactory(cloudRunConfig);

      expect(client).toBeDefined();

      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;
      process.env.K_SERVICE = originalKService;
      if (originalPgPassword) {
        process.env.PGPASSWORD = originalPgPassword;
      }
    });
  });

  describe('DRIZZLE_CLIENT symbol', () => {
    it('should be a symbol', () => {
      expect(typeof DRIZZLE_CLIENT).toBe('symbol');
    });

    it('should have a description', () => {
      expect(DRIZZLE_CLIENT.toString()).toContain('DRIZZLE_CLIENT');
    });
  });
});
