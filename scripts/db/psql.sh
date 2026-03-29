#!/usr/bin/env bash

# Open PostgreSQL shell (psql)
# Usage: pnpm db:psql

set -e

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  Container doesn't exist. Run 'pnpm db:start' first.${NC}"
  exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  Container is stopped. Run 'pnpm db:start' first.${NC}"
  exit 1
fi

echo -e "${BLUE}🔌 Connecting to PostgreSQL...${NC}"
echo -e "${GREEN}✅ Connected to chamuco_dev${NC}"
echo ""
docker exec -it ${CONTAINER_NAME} psql -U postgres -d chamuco_dev
