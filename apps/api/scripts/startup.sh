#!/bin/sh
set -e

echo "🚀 Starting Chamuco API..."

cd /app/apps/api

# Get IAM token for Cloud Run
if [ "$NODE_ENV" = "production" ] && [ -n "$K_SERVICE" ]; then
  echo "🔑 Getting IAM authentication token..."
  export PGPASSWORD=$(node scripts/get-iam-token.js)
  if [ -z "$PGPASSWORD" ]; then
    echo "❌ Failed to get IAM token"
    exit 1
  fi
fi

# Run database migrations
echo "📦 Running database migrations..."
node scripts/run-migrations.js

# Start the application (invoke node directly — deps are already installed at
# build time, and going through pnpm/corepack here risks a runtime package-manager
# version check triggering a full workspace reinstall, see incident 2026-09-07)
echo "🎯 Starting NestJS application..."
exec node dist/main
