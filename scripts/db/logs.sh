#!/usr/bin/env bash

# View PostgreSQL container logs
# Usage: pnpm db:logs

set -e

# Color codes for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  Container doesn't exist. Run 'pnpm db:start' first.${NC}"
  exit 1
fi

echo -e "${BLUE}📋 Tailing PostgreSQL logs... (Ctrl+C to exit)${NC}"
echo ""
docker compose logs -f postgres
