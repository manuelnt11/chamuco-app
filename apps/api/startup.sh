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
set +e  # Temporarily disable exit on error to capture output
MIGRATION_OUTPUT=$(pnpm run db:migrate 2>&1)
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

echo "$MIGRATION_OUTPUT"

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed with exit code: $MIGRATION_EXIT_CODE"
  echo "📋 Full migration output:"
  echo "$MIGRATION_OUTPUT"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec pnpm run start:prod
