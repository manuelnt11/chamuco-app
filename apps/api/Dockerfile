# ==========================================
# Stage 1: Dependencies
# Install production dependencies only
# ==========================================
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS deps

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
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder

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

# Build workspace packages first so @chamuco/* imports resolve
RUN pnpm --filter @chamuco/shared-types --filter @chamuco/shared-utils build

# Build the application
RUN pnpm --filter @chamuco/api build

# ==========================================
# Stage 3: Runner
# Production runtime image
# ==========================================
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS runner

# Install curl for health checks, Chromium for PDF rendering (puppeteer-core), and enable pnpm.
# font-noto-emoji: itinerary notes/destination labels are organizer-authored and often contain
# emoji — without it Chromium has no glyphs to paint them and renders tofu boxes in the PDF.
RUN apk add --no-cache curl chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto-emoji fontconfig && \
    fc-cache -f && \
    corepack enable && \
    corepack prepare pnpm@10.33.0 --activate

# puppeteer-core drives this system Chromium instead of downloading its own (musl/Alpine has no
# compatible prebuilt binary — see CHROMIUM_EXECUTABLE_PATH in environment.schema.ts)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy workspace configuration
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml ./

# Copy production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/

# Copy drizzle configuration and migrations
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/drizzle.config.ts ./apps/api/
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/src/database/migrations ./apps/api/src/database/migrations
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/src/database/schema ./apps/api/src/database/schema

# Copy runtime scripts (startup, IAM token helper, and migration runner)
COPY --chown=nestjs:nodejs apps/api/scripts ./apps/api/scripts
RUN chmod +x ./apps/api/scripts/startup.sh

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
CMD ["./scripts/startup.sh"]
