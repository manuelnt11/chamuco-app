#!/usr/bin/env bash

# Restore production backup to local Docker PostgreSQL
# Usage: pnpm db:restore

set -e

# Color codes for output
RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="chamuco-postgres"
VOLUME_NAME="chamuco-postgres-data"
LOCAL_BACKUP_DIR="backups"

echo ""
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  WARNING: RESTORE FROM PRODUCTION${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  1. Stop your local Docker PostgreSQL container"
echo -e "  2. Delete ALL local database data permanently"
echo -e "  3. Remove the Docker volume"
echo -e "  4. Restore production backup to local database"
echo -e "  5. Run any pending migrations"
echo ""
echo -e "${RED}ALL LOCAL DATA WILL BE LOST. THIS CANNOT BE UNDONE.${NC}"
echo ""

# Check if backups directory exists and has files
if [ ! -d "${LOCAL_BACKUP_DIR}" ] || [ -z "$(ls -A ${LOCAL_BACKUP_DIR}/*.sql.gz 2>/dev/null)" ]; then
  echo -e "${RED}❌ No backup files found in ${LOCAL_BACKUP_DIR}/${NC}"
  echo -e "${YELLOW}Run 'pnpm db:backup' first to create a backup${NC}"
  exit 1
fi

# List available backups
echo -e "${BLUE}📦 Available backups:${NC}"
echo ""
backup_files=($(ls -t ${LOCAL_BACKUP_DIR}/*.sql.gz 2>/dev/null))
for i in "${!backup_files[@]}"; do
  file="${backup_files[$i]}"
  filename=$(basename "$file")
  size=$(du -h "$file" | cut -f1)
  timestamp=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1)
  echo -e "  ${GREEN}[$((i+1))]${NC} ${filename}"
  echo -e "      Size: ${size}, Downloaded: ${timestamp}"
  echo ""
done

# Select backup file
read -p "Select backup number to restore (1-${#backup_files[@]}), or 'q' to quit: " selection

if [ "$selection" = "q" ] || [ "$selection" = "Q" ]; then
  echo -e "${BLUE}ℹ️  Restore cancelled${NC}"
  exit 0
fi

if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#backup_files[@]}" ]; then
  echo -e "${RED}❌ Invalid selection${NC}"
  exit 1
fi

BACKUP_FILE="${backup_files[$((selection-1))]}"
echo ""
echo -e "${GREEN}✅ Selected: $(basename ${BACKUP_FILE})${NC}"
echo ""

# First confirmation
echo -e "${RED}⚠️  WARNING: You are about to destroy your local database!${NC}"
read -p "Are you absolutely sure you want to continue? Type 'YES' in capital letters: " confirm1

if [ "$confirm1" != "YES" ]; then
  echo -e "${BLUE}ℹ️  Restore cancelled${NC}"
  exit 0
fi

echo ""

# Second confirmation - more explicit
echo -e "${RED}⚠️  FINAL WARNING: ALL LOCAL DATABASE DATA WILL BE PERMANENTLY DELETED${NC}"
read -p "Type 'DELETE LOCAL DATABASE' to confirm: " confirm2

if [ "$confirm2" != "DELETE LOCAL DATABASE" ]; then
  echo -e "${BLUE}ℹ️  Restore cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}🔄 Starting restore process...${NC}"
echo ""

# Stop container if running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${BLUE}ℹ️  Stopping container...${NC}"
  docker compose stop > /dev/null 2>&1
  echo -e "${GREEN}✅ Container stopped${NC}"
fi

# Remove container if exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${BLUE}ℹ️  Removing container...${NC}"
  docker rm ${CONTAINER_NAME} > /dev/null 2>&1
  echo -e "${GREEN}✅ Container removed${NC}"
fi

# Remove volume if exists
if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
  echo -e "${BLUE}ℹ️  Removing volume...${NC}"
  docker volume rm ${VOLUME_NAME} > /dev/null 2>&1
  echo -e "${GREEN}✅ Volume removed${NC}"
fi

echo ""

# Start fresh container
echo -e "${BLUE}ℹ️  Creating fresh PostgreSQL container...${NC}"
docker compose up -d > /dev/null 2>&1

# Wait for PostgreSQL to be ready
echo -e "${BLUE}ℹ️  Waiting for PostgreSQL to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while ! docker exec ${CONTAINER_NAME} pg_isready -U postgres > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}❌ PostgreSQL took too long to start${NC}"
    exit 1
  fi
  sleep 1
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Restore backup
echo -e "${BLUE}ℹ️  Restoring backup...${NC}"
echo -e "${YELLOW}   This may take several minutes depending on backup size${NC}"

# Decompress and restore in one step
gunzip -c "${BACKUP_FILE}" | docker exec -i ${CONTAINER_NAME} psql -U postgres -d chamuco_dev > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backup restored successfully${NC}"
else
  echo -e "${RED}❌ Restore failed${NC}"
  echo -e "${YELLOW}Check that the backup file is valid${NC}"
  exit 1
fi

echo ""

# Run migrations to catch up to latest schema
echo -e "${BLUE}ℹ️  Running database migrations...${NC}"
pnpm --filter api db:migrate > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Migrations applied${NC}"
else
  echo -e "${YELLOW}⚠️  Migration failed or no new migrations to apply${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Restore completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Database Status:${NC}"

# Get database stats
TABLES_COUNT=$(docker exec ${CONTAINER_NAME} psql -U postgres -d chamuco_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
DB_SIZE=$(docker exec ${CONTAINER_NAME} psql -U postgres -d chamuco_dev -t -c "SELECT pg_size_pretty(pg_database_size('chamuco_dev'));" 2>/dev/null | xargs)

echo -e "   Tables:        ${TABLES_COUNT}"
echo -e "   Database Size: ${DB_SIZE}"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "   pnpm db:psql    Open psql shell"
echo -e "   pnpm db:logs    View container logs"
echo -e "   pnpm db:stop    Stop the database"
echo ""
