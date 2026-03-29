#!/usr/bin/env bash

# Backup Cloud SQL database to Cloud Storage and download locally
# Usage: pnpm db:backup

set -e

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ID="chamuco-app-mn"
INSTANCE_NAME="chamuco-postgres"
DATABASE_NAME="chamuco_prod"
BUCKET_NAME="chamuco-db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/chamuco_prod_${TIMESTAMP}.sql.gz"
LOCAL_BACKUP_DIR="backups"

echo -e "${BLUE}🔄 Starting Cloud SQL backup process...${NC}"
echo ""

# Verify gcloud authentication
echo -e "${BLUE}ℹ️  Verifying gcloud authentication...${NC}"
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" > /dev/null 2>&1; then
  echo -e "${RED}❌ Not authenticated with gcloud${NC}"
  echo -e "${YELLOW}Run: gcloud auth login${NC}"
  exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter="status:ACTIVE" --format="value(account)")
echo -e "${GREEN}✅ Authenticated as: ${ACTIVE_ACCOUNT}${NC}"
echo ""

# Check if instance exists
echo -e "${BLUE}ℹ️  Checking Cloud SQL instance status...${NC}"
if ! gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} > /dev/null 2>&1; then
  echo -e "${RED}❌ Cloud SQL instance '${INSTANCE_NAME}' not found${NC}"
  exit 1
fi

INSTANCE_STATUS=$(gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} --format="value(state)")
if [ "${INSTANCE_STATUS}" != "RUNNABLE" ]; then
  echo -e "${RED}❌ Instance is not RUNNABLE (current state: ${INSTANCE_STATUS})${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Instance status: ${INSTANCE_STATUS}${NC}"
echo ""

# Export database to Cloud Storage
echo -e "${BLUE}ℹ️  Exporting database to Cloud Storage...${NC}"
echo -e "${YELLOW}   This may take several minutes depending on database size${NC}"

gcloud sql export sql ${INSTANCE_NAME} \
  gs://${BUCKET_NAME}/${BACKUP_FILE} \
  --database=${DATABASE_NAME} \
  --project=${PROJECT_ID} \
  --async > /dev/null

# Wait for export to complete
echo -e "${BLUE}ℹ️  Waiting for export operation to complete...${NC}"

OPERATION_NAME=$(gcloud sql operations list \
  --instance=${INSTANCE_NAME} \
  --filter="status:RUNNING" \
  --format="value(name)" \
  --limit=1)

if [ -z "${OPERATION_NAME}" ]; then
  # Check if there's a recent successful operation
  sleep 2
  RECENT_EXPORT=$(gcloud sql operations list \
    --instance=${INSTANCE_NAME} \
    --filter="operationType:EXPORT" \
    --format="value(name)" \
    --limit=1)

  if [ -n "${RECENT_EXPORT}" ]; then
    OPERATION_NAME="${RECENT_EXPORT}"
  else
    echo -e "${RED}❌ Could not find export operation${NC}"
    exit 1
  fi
fi

# Poll operation status
while true; do
  OPERATION_STATUS=$(gcloud sql operations describe ${OPERATION_NAME} \
    --project=${PROJECT_ID} \
    --format="value(status)")

  if [ "${OPERATION_STATUS}" = "DONE" ]; then
    echo -e "${GREEN}✅ Export completed successfully${NC}"
    break
  elif [ "${OPERATION_STATUS}" = "FAILED" ]; then
    echo -e "${RED}❌ Export operation failed${NC}"
    gcloud sql operations describe ${OPERATION_NAME} --project=${PROJECT_ID}
    exit 1
  else
    echo -e "${YELLOW}   Status: ${OPERATION_STATUS}...${NC}"
    sleep 5
  fi
done

echo ""

# Get backup file size
BACKUP_SIZE=$(gsutil du -s gs://${BUCKET_NAME}/${BACKUP_FILE} | awk '{print $1}')
BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))
echo -e "${GREEN}✅ Backup size: ${BACKUP_SIZE_MB} MB${NC}"
echo ""

# Create local backup directory
mkdir -p ${LOCAL_BACKUP_DIR}

# Download backup to local
echo -e "${BLUE}ℹ️  Downloading backup to local directory...${NC}"
gsutil cp gs://${BUCKET_NAME}/${BACKUP_FILE} ${LOCAL_BACKUP_DIR}/ > /dev/null

LOCAL_FILE="${LOCAL_BACKUP_DIR}/$(basename ${BACKUP_FILE})"
echo -e "${GREEN}✅ Backup downloaded: ${LOCAL_FILE}${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 Backup Information:${NC}"
echo -e "   Cloud Storage: gs://${BUCKET_NAME}/${BACKUP_FILE}"
echo -e "   Local Path:    ${LOCAL_FILE}"
echo -e "   Size:          ${BACKUP_SIZE_MB} MB"
echo -e "   Timestamp:     ${TIMESTAMP}"
echo ""
echo -e "${BLUE}📝 To restore this backup locally:${NC}"
echo -e "   ${YELLOW}pnpm db:restore${NC}"
echo ""
echo -e "${BLUE}ℹ️  Note: Backups in Cloud Storage are auto-deleted after 30 days${NC}"
echo ""
