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
 * Parse DATABASE_URL to extract connection parameters
 * Supports both standard URLs and Cloud SQL Unix socket format
 */
function parseDatabaseUrl(
  url: string,
): string | { host: string; database: string; username: string } {
  // Check if it's a Cloud SQL Unix socket connection
  // Format: postgresql://username@/database?host=/cloudsql/instance
  const unixSocketMatch = url.match(/^postgresql:\/\/([^@]+)@\/([^?]+)\?host=(.+)$/);

  if (unixSocketMatch && unixSocketMatch[1] && unixSocketMatch[2] && unixSocketMatch[3]) {
    // Cloud SQL Unix socket format
    return {
      host: unixSocketMatch[3], // /cloudsql/project:region:instance
      database: unixSocketMatch[2],
      username: unixSocketMatch[1],
    };
  }

  // Standard URL format - let postgres.js parse it
  return url;
}

/**
 * Factory function that creates and configures the Drizzle client
 */
export const drizzleProvider = {
  provide: DRIZZLE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleClient => {
    const databaseUrl = configService.get<string>('DATABASE_URL')!;
    const poolMax = configService.get<number>('DATABASE_POOL_MAX', 10);

    // Parse the DATABASE_URL
    const connectionConfig = parseDatabaseUrl(databaseUrl);

    // Create PostgreSQL connection with optimized pool settings
    const client =
      typeof connectionConfig === 'string'
        ? postgres(connectionConfig, {
            max: poolMax,
            idle_timeout: 20, // Close idle connections after 20s (Cloud Run optimization)
            connect_timeout: 10, // Fail fast if connection takes >10s
            prepare: false, // Disable prepared statements (better for serverless)
          })
        : postgres({
            ...connectionConfig,
            max: poolMax,
            idle_timeout: 20,
            connect_timeout: 10,
            prepare: false,
          });

    // Create Drizzle instance with schema
    return drizzle(client, { schema });
  },
};
