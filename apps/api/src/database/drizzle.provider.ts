import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Injection token for Drizzle client
 */
export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');

/**
 * Drizzle client type with schema inference
 */
export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Factory function that creates and configures the Drizzle client
 */
export const drizzleProvider = {
  provide: DRIZZLE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleClient => {
    const poolMax = configService.get<number>('DATABASE_POOL_MAX', 10);
    const nodeEnv = configService.get<string>('NODE_ENV');
    const kService = process.env.K_SERVICE; // Cloud Run sets this

    let client: ReturnType<typeof postgres>;

    // Cloud Run uses unix socket with IAM authentication
    if (nodeEnv === 'production' && kService) {
      client = postgres({
        host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
        database: 'chamuco_prod',
        user: 'chamuco-api-sa@chamuco-app-mn.iam',
        // Fetched per connection — tokens expire every ~1h
        password: async () => {
          const res = await fetch(
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            { headers: { 'Metadata-Flavor': 'Google' } },
          );
          const data = (await res.json()) as { access_token: string };
          return data.access_token;
        },
        max: poolMax,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      });
    } else {
      // Local development uses DATABASE_URL
      const databaseUrl = configService.get<string>('DATABASE_URL')!;
      client = postgres(databaseUrl, {
        max: poolMax,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      });
    }

    // Create Drizzle instance with schema
    return drizzle(client, { schema });
  },
};
