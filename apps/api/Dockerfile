# ==========================================
# Stage 1: Dependencies
# Install production dependencies only
# ==========================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy all package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ==========================================
# Stage 2: Builder
# Build the application
# ==========================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Copy all package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install ALL dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code for shared packages
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils

# Copy API source code
COPY apps/api ./apps/api

# Build the application
RUN pnpm --filter @chamuco/api build

# ==========================================
# Stage 3: Runner
# Production runtime image
# ==========================================
FROM node:22-alpine AS runner

# Install curl for health checks, wget for downloading proxy, and enable pnpm
RUN apk add --no-cache curl wget && \
    corepack enable && \
    corepack prepare pnpm@10.33.0 --activate

# Download and install Cloud SQL Auth Proxy
RUN wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.linux.amd64 -O /usr/local/bin/cloud-sql-proxy && \
    chmod +x /usr/local/bin/cloud-sql-proxy

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy workspace configuration
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml ./

# Copy production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps --chown=nestjs:nodejs /app/packages ./packages

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/

# Copy drizzle configuration and migrations
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/drizzle.config.ts ./apps/api/
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/src/database/migrations ./apps/api/src/database/migrations
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/src/database/schema ./apps/api/src/database/schema

# Copy startup script, connection test, IAM token helper, and migration runner
COPY --chown=nestjs:nodejs apps/api/startup.sh ./apps/api/
COPY --chown=nestjs:nodejs apps/api/test-db-connection.js ./apps/api/
COPY --chown=nestjs:nodejs apps/api/get-iam-token.js ./apps/api/
COPY --chown=nestjs:nodejs apps/api/run-migrations.js ./apps/api/
RUN chmod +x ./apps/api/startup.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Set working directory to api
WORKDIR /app/apps/api

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application (runs migrations first, then starts the app)
CMD ["./startup.sh"]
