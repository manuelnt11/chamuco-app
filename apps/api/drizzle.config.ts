import type { Config } from 'drizzle-kit';

// Parse DATABASE_URL or use Cloud SQL unix socket
const getDbCredentials = () => {
  // Cloud Run uses unix socket
  if (process.env.NODE_ENV === 'production' && process.env.K_SERVICE) {
    return {
      host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
      database: 'chamuco_prod',
      user: 'chamuco-api-sa',
    };
  }

  // Local development uses DATABASE_URL
  return {
    url: process.env.DATABASE_URL!,
  };
};

export default {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: getDbCredentials(),
  verbose: true,
  strict: true,
} satisfies Config;
