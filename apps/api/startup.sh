#!/bin/sh
set -e

echo "🚀 Starting Chamuco API..."

# Debug: Show environment
echo "📍 Environment:"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..." # Show first 50 chars only
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"

# Run database migrations
echo "📦 Running database migrations..."

# Run migrations with verbose output
set +e  # Temporarily disable exit on error to capture output
cd /app/apps/api
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
