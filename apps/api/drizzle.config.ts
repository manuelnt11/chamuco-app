import type { Config } from 'drizzle-kit';

// Parse DATABASE_URL or use Cloud SQL unix socket
const getDbCredentials = () => {
  // Cloud Run uses unix socket with IAM authentication
  // The IAM token is passed via PGPASSWORD environment variable
  if (process.env.NODE_ENV === 'production' && process.env.K_SERVICE) {
    return {
      host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
      database: 'chamuco_prod',
      user: 'chamuco-api-sa@chamuco-app-mn.iam', // IAM user as registered in Cloud SQL
      password: process.env.PGPASSWORD || '', // Token passed via env var
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
