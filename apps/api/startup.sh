#!/bin/sh
set -e

echo "🚀 Starting Chamuco API..."

# Debug: Show environment
echo "📍 Environment:"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars only
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"

# Check if Cloud Run unix socket exists
if [ "$NODE_ENV" = "production" ] && [ -n "$K_SERVICE" ]; then
  echo "🔍 Checking for Cloud Run unix socket..."
  if [ -S "/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres/.s.PGSQL.5432" ]; then
    echo "✅ Cloud Run unix socket found"
    ls -la /cloudsql/chamuco-app-mn:us-central1:chamuco-postgres/
  else
    echo "❌ Cloud Run unix socket not found"
    exit 1
  fi
fi

# Test database connection first
echo "🔍 Testing database connection..."
cd /app/apps/api
if ! node test-db-connection.js 2>&1; then
  echo "❌ Database connection test failed - exiting"
  exit 1
fi

# Run database migrations
echo "📦 Running database migrations..."

# Get IAM token if in Cloud Run
if [ "$NODE_ENV" = "production" ] && [ -n "$K_SERVICE" ]; then
  echo "🔑 Getting IAM authentication token..."
  export PGPASSWORD=$(node get-iam-token.js)
  if [ -z "$PGPASSWORD" ]; then
    echo "❌ Failed to get IAM token"
    exit 1
  fi
  echo "✅ IAM token acquired"
fi

# Run migrations using custom script
set +e  # Temporarily disable exit on error to capture output
node run-migrations.js 2>&1
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed with exit code: $MIGRATION_EXIT_CODE"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec pnpm run start:prod
