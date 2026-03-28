#!/usr/bin/env bash

# Reset PostgreSQL database (WARNING: destroys all data)
# Usage: pnpm db:reset

set -e

# Color codes for output
RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"
VOLUME_NAME="chamuco-postgres-data"

echo ""
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  WARNING: DATABASE RESET${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  1. Stop the PostgreSQL container"
echo -e "  2. Delete ALL database data permanently"
echo -e "  3. Remove the Docker volume"
echo -e "  4. Create a fresh database"
echo -e "  5. Run migrations"
echo ""
echo -e "${RED}ALL DATA WILL BE LOST. THIS CANNOT BE UNDONE.${NC}"
echo ""

# Confirmation prompt
read -p "Are you sure you want to reset the database? Type 'RESET' to confirm: " confirmation

if [ "$confirmation" != "RESET" ]; then
  echo -e "${BLUE}ℹ️  Reset cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}🔄 Resetting database...${NC}"

# Stop container if running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${BLUE}ℹ️  Stopping container...${NC}"
  docker compose stop
  echo -e "${GREEN}✅ Container stopped${NC}"
fi

# Remove container if exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${BLUE}ℹ️  Removing container...${NC}"
  docker rm ${CONTAINER_NAME}
  echo -e "${GREEN}✅ Container removed${NC}"
fi

# Remove volume if exists
if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
  echo -e "${BLUE}ℹ️  Removing volume...${NC}"
  docker volume rm ${VOLUME_NAME}
  echo -e "${GREEN}✅ Volume removed${NC}"
fi

# Start fresh container
echo -e "${BLUE}ℹ️  Creating fresh database...${NC}"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "${BLUE}ℹ️  Waiting for PostgreSQL to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while ! docker exec ${CONTAINER_NAME} pg_isready -U postgres > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}❌ PostgreSQL took too long to start. Check logs with: pnpm db:logs${NC}"
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
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}ℹ️  Fresh database with latest migrations is ready${NC}"
echo ""
