#!/usr/bin/env bash

# Start PostgreSQL Docker container and run migrations
# Usage: pnpm db:start

set -e

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"

echo -e "${BLUE}🚀 Starting PostgreSQL database...${NC}"

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  # Container exists
  CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' ${CONTAINER_NAME})

  if [ "$CONTAINER_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Container is already running${NC}"
  else
    echo -e "${YELLOW}⚠️  Container exists but is stopped. Starting...${NC}"
    docker start ${CONTAINER_NAME}
    echo -e "${GREEN}✅ Container started${NC}"
  fi
else
  # Container doesn't exist, create it
  echo -e "${BLUE}ℹ️  Container doesn't exist. Creating...${NC}"
  docker compose up -d
  echo -e "${GREEN}✅ Container created and started${NC}"
fi

# Wait for PostgreSQL to be ready
echo -e "${BLUE}ℹ️  Waiting for PostgreSQL to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while ! docker exec ${CONTAINER_NAME} pg_isready -U postgres > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL took too long to start. Check logs with: pnpm db:logs${NC}"
    exit 1
  fi
  sleep 1
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Run migrations
echo -e "${BLUE}ℹ️  Running database migrations...${NC}"
pnpm --filter api db:migrate

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Connection details:${NC}"
echo -e "   Host:     localhost"
echo -e "   Port:     5432"
echo -e "   Database: chamuco_dev"
echo -e "   User:     postgres"
echo -e "   Password: postgres"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "   pnpm db:stop    Stop the database"
echo -e "   pnpm db:psql    Open psql shell"
echo -e "   pnpm db:logs    View container logs"
echo -e "   pnpm db:reset   Reset database (WARNING: destroys all data)"
echo ""
