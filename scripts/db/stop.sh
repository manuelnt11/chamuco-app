#!/usr/bin/env bash

# Stop PostgreSQL Docker container (preserves data)
# Usage: pnpm db:stop

set -e

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"

echo -e "${BLUE}🛑 Stopping PostgreSQL database...${NC}"

# Check if container exists and is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker compose stop
  echo -e "${GREEN}✅ Database stopped${NC}"
  echo -e "${BLUE}ℹ️  Data is preserved. Run 'pnpm db:start' to start again.${NC}"
elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  Container is already stopped${NC}"
else
  echo -e "${YELLOW}⚠️  Container doesn't exist. Nothing to stop.${NC}"
fi
