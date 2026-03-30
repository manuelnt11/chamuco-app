#!/bin/sh
set -e

echo "🚀 Starting Chamuco API..."

# Debug: Show environment
echo "📍 Environment:"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars only
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"

# Start Cloud SQL Auth Proxy in background (only in Cloud Run)
if [ "$NODE_ENV" = "production" ] && [ -n "$K_SERVICE" ]; then
  echo "🔌 Starting Cloud SQL Auth Proxy..."
  mkdir -p /cloudsql
  cloud-sql-proxy --unix-socket /cloudsql chamuco-app-mn:us-central1:chamuco-postgres &
  PROXY_PID=$!
  echo "  Proxy PID: $PROXY_PID"

  # Wait for proxy to be ready
  echo "⏳ Waiting for proxy to be ready..."
  for i in 1 2 3 4 5; do
    if [ -S "/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres/.s.PGSQL.5432" ]; then
      echo "✅ Proxy is ready"
      break
    fi
    echo "  Attempt $i/5: socket not ready yet..."
    sleep 2
  done

  if [ ! -S "/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres/.s.PGSQL.5432" ]; then
    echo "❌ Proxy failed to start"
    kill $PROXY_PID 2>/dev/null || true
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

# Run migrations with verbose output
set +e  # Temporarily disable exit on error to capture output
npx drizzle-kit migrate 2>&1
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed with exit code: $MIGRATION_EXIT_CODE"
  echo "🔍 Debugging information:"
  echo "  DATABASE_URL format: ${DATABASE_URL:0:80}"
  echo "  Node version: $(node --version)"
  echo "  NPM version: $(npm --version)"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec pnpm run start:prod
