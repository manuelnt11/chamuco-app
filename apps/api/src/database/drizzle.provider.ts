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
    const databaseUrl = configService.get<string>('DATABASE_URL')!;
    const poolMax = configService.get<number>('DATABASE_POOL_MAX', 10);

    // Create PostgreSQL connection with optimized pool settings
    const client = postgres(databaseUrl, {
      max: poolMax,
      idle_timeout: 20, // Close idle connections after 20s (Cloud Run optimization)
      connect_timeout: 10, // Fail fast if connection takes >10s
      prepare: false, // Disable prepared statements (better for serverless)
    });

    // Create Drizzle instance with schema
    return drizzle(client, { schema });
  },
};
