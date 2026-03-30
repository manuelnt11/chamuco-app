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
if pnpm run db:migrate 2>&1; then
  echo "✅ Migrations completed successfully"
else
  MIGRATION_EXIT_CODE=$?
  echo "❌ Migrations failed with exit code: $MIGRATION_EXIT_CODE"
  echo "💡 Check logs above for detailed error"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec pnpm run start:prod
