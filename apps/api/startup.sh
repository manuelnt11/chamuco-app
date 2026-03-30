#!/bin/sh
set -e

echo "🚀 Starting Chamuco API..."

# Run database migrations
echo "📦 Running database migrations..."
pnpm run db:migrate

# Check if migrations succeeded
if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec pnpm run start:prod
