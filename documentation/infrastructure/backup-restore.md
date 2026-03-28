# Backup & Restore Workflow

**Status:** Implemented
**Last Updated:** 2026-03-28

This guide covers the backup and restore workflow for syncing production Cloud SQL data to your local development environment.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backup Workflow](#backup-workflow)
4. [Restore Workflow](#restore-workflow)
5. [Common Use Cases](#common-use-cases)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

The backup and restore system provides a safe way to:

- **Export production database** to Cloud Storage
- **Download backups** to your local machine
- **Restore production data** to local Docker PostgreSQL for debugging
- **Automatic cleanup** of old backups (30-day retention)

**Important:** This is a **one-way sync** (production → local). Local changes are never pushed back to production.

---

## Prerequisites

### Required Tools

1. **gcloud CLI** authenticated

   ```bash
   gcloud auth list
   ```

2. **Docker** running (for local restore)

   ```bash
   docker ps
   ```

3. **Local database** container available
   ```bash
   pnpm db:start
   ```

### Required Permissions

Your GCP user account needs:

- `roles/cloudsql.admin` or `roles/cloudsql.editor` — To export databases
- `roles/storage.objectAdmin` — To read/write Cloud Storage backups

**Check your permissions:**

```bash
gcloud projects get-iam-policy chamuco-app-mn \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL@gmail.com"
```

---

## Backup Workflow

### Step 1: Export from Cloud SQL

Run the backup command:

```bash
pnpm db:backup
```

**What it does:**

1. ✅ Verifies gcloud authentication
2. ✅ Checks Cloud SQL instance status
3. ✅ Exports database to Cloud Storage (`gs://chamuco-db-backups/backups/`)
4. ✅ Waits for export operation to complete
5. ✅ Downloads backup to local `backups/` directory
6. ✅ Shows backup information (size, location, timestamp)

**Output example:**

```
🔄 Starting Cloud SQL backup process...

ℹ️  Verifying gcloud authentication...
✅ Authenticated as: manuelnt11@gmail.com

ℹ️  Checking Cloud SQL instance status...
✅ Instance status: RUNNABLE

ℹ️  Exporting database to Cloud Storage...
   This may take several minutes depending on database size

ℹ️  Waiting for export operation to complete...
   Status: RUNNING...
✅ Export completed successfully

✅ Backup size: 42 MB

ℹ️  Downloading backup to local directory...
✅ Backup downloaded: backups/chamuco_prod_20260328_164500.sql.gz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backup completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Backup Information:
   Cloud Storage: gs://chamuco-db-backups/backups/chamuco_prod_20260328_164500.sql.gz
   Local Path:    backups/chamuco_prod_20260328_164500.sql.gz
   Size:          42 MB
   Timestamp:     20260328_164500

📝 To restore this backup locally:
   pnpm db:restore

ℹ️  Note: Backups in Cloud Storage are auto-deleted after 30 days
```

### Backup File Naming

Format: `chamuco_prod_YYYYMMDD_HHMMSS.sql.gz`

Example: `chamuco_prod_20260328_164500.sql.gz`

- Date: 2026-03-28
- Time: 16:45:00

### Storage Locations

**Cloud Storage:**

- Bucket: `gs://chamuco-db-backups`
- Path: `backups/chamuco_prod_YYYYMMDD_HHMMSS.sql.gz`
- Retention: 30 days (automatic cleanup)

**Local:**

- Directory: `backups/`
- Files: `.sql.gz` compressed dumps
- Retention: Manual (not auto-deleted)

---

## Restore Workflow

### Step 2: Restore to Local Database

⚠️ **WARNING:** This operation **destroys all local database data**. Use with caution.

Run the restore command:

```bash
pnpm db:restore
```

**What it does:**

1. ⚠️ Shows big red warning about data loss
2. 📦 Lists all available local backup files
3. ✋ Requires TWO explicit confirmations
4. 🛑 Stops local Docker PostgreSQL container
5. 🗑️ Removes container and volume (data deleted)
6. 🆕 Creates fresh container
7. 📥 Restores backup to local database
8. 🔄 Runs pending migrations
9. 📊 Shows database stats

**Interactive Flow:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  WARNING: RESTORE FROM PRODUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This will:
  1. Stop your local Docker PostgreSQL container
  2. Delete ALL local database data permanently
  3. Remove the Docker volume
  4. Restore production backup to local database
  5. Run any pending migrations

ALL LOCAL DATA WILL BE LOST. THIS CANNOT BE UNDONE.

📦 Available backups:

  [1] chamuco_prod_20260328_164500.sql.gz
      Size: 42M, Downloaded: 2026-03-28 16:45:00

  [2] chamuco_prod_20260327_093000.sql.gz
      Size: 38M, Downloaded: 2026-03-27 09:30:00

Select backup number to restore (1-2), or 'q' to quit: 1

✅ Selected: chamuco_prod_20260328_164500.sql.gz

⚠️  WARNING: You are about to destroy your local database!
Are you absolutely sure you want to continue? Type 'YES' in capital letters: YES

⚠️  FINAL WARNING: ALL LOCAL DATABASE DATA WILL BE PERMANENTLY DELETED
Type 'DELETE LOCAL DATABASE' to confirm: DELETE LOCAL DATABASE

🔄 Starting restore process...

ℹ️  Stopping container...
✅ Container stopped
ℹ️  Removing container...
✅ Container removed
ℹ️  Removing volume...
✅ Volume removed

ℹ️  Creating fresh PostgreSQL container...
ℹ️  Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready

ℹ️  Restoring backup...
   This may take several minutes depending on backup size
✅ Backup restored successfully

ℹ️  Running database migrations...
✅ Migrations applied

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Restore completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Database Status:
   Tables:        23
   Database Size: 45 MB

🔧 Useful commands:
   pnpm db:psql    Open psql shell
   pnpm db:logs    View container logs
   pnpm db:stop    Stop the database
```

### Safety Mechanisms

The restore process includes multiple safety checks:

1. **Pre-flight checks:**
   - Verifies backup files exist
   - Lists available backups for selection

2. **Two-stage confirmation:**
   - First prompt: Type `YES` (all caps)
   - Second prompt: Type `DELETE LOCAL DATABASE` (exact match)

3. **Atomic operations:**
   - Container and volume removed completely before restore
   - Fresh container ensures clean state

4. **Post-restore validation:**
   - Runs migrations to sync schema to latest version
   - Shows table count and database size

---

## Common Use Cases

### Use Case 1: Debug with Production Data

**Scenario:** You need to reproduce a production bug locally.

```bash
# 1. Backup production
pnpm db:backup

# 2. Restore to local
pnpm db:restore
# Select most recent backup
# Confirm twice

# 3. Debug locally
pnpm db:psql
# Your local database now has production data
```

### Use Case 2: Test Migration on Production Data

**Scenario:** You want to test a new migration against production data before deploying.

```bash
# 1. Backup production
pnpm db:backup

# 2. Restore to local
pnpm db:restore

# 3. Create your migration
# Edit schema in apps/api/src/database/schema/
pnpm --filter api db:generate

# 4. Test migration locally
pnpm --filter api db:migrate

# 5. Verify migration worked
pnpm db:psql
\dt  # List tables
SELECT * FROM your_new_table LIMIT 10;

# If migration works, commit and deploy
git add apps/api/src/database/
git commit -m "feat: add new_table migration"
```

### Use Case 3: Reset Local to Match Production

**Scenario:** Your local database is in a weird state and you want to reset it.

```bash
# 1. Backup production (if you don't have a recent backup)
pnpm db:backup

# 2. Restore to local
pnpm db:restore
# This nukes local and restores fresh production copy
```

### Use Case 4: Share Data with Team Member

**Scenario:** A team member needs production data on their machine.

**Option A: Via Cloud Storage (Recommended)**

```bash
# Team member runs backup script (downloads from Cloud Storage)
pnpm db:backup
pnpm db:restore
```

**Option B: Via Local File Share**

```bash
# You send backup file to team member
# They copy to backups/ directory
cp ~/Downloads/chamuco_prod_20260328_164500.sql.gz backups/

# Then restore
pnpm db:restore
```

---

## Troubleshooting

### Issue: "No backup files found"

**Error:**

```
❌ No backup files found in backups/
Run 'pnpm db:backup' first to create a backup
```

**Solution:**

```bash
# Create a backup first
pnpm db:backup
```

### Issue: "Cloud SQL instance not found"

**Error:**

```
❌ Cloud SQL instance 'chamuco-postgres' not found
```

**Causes:**

- Wrong project ID
- Instance not yet created
- Insufficient permissions

**Solution:**

```bash
# Verify project
gcloud config get-value project

# Set correct project
gcloud config set project chamuco-app-mn

# Verify instance exists
gcloud sql instances list
```

### Issue: "Export operation failed"

**Error:**

```
❌ Export operation failed
```

**Causes:**

- Insufficient Cloud Storage permissions
- Bucket doesn't exist
- Instance is not RUNNABLE

**Solution:**

```bash
# Check instance status
gcloud sql instances describe chamuco-postgres \
  --format="value(state)"

# Verify bucket exists
gsutil ls gs://chamuco-db-backups

# Check permissions
gcloud projects get-iam-policy chamuco-app-mn \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL@gmail.com"
```

### Issue: "Restore failed"

**Error:**

```
❌ Restore failed
Check that the backup file is valid
```

**Causes:**

- Corrupted backup file
- Incompatible PostgreSQL version
- Disk space issue

**Solution:**

```bash
# Verify backup file integrity
gunzip -t backups/chamuco_prod_*.sql.gz

# Check Docker has space
docker system df

# Re-download backup
rm backups/chamuco_prod_*.sql.gz
pnpm db:backup
```

### Issue: "Docker container won't start"

**Cause:** Port 5432 already in use

**Solution:**

```bash
# Check what's using port 5432
lsof -i :5432

# Stop system PostgreSQL if needed
brew services stop postgresql@16  # macOS
sudo systemctl stop postgresql    # Linux
```

---

## Best Practices

### 1. Backup Frequency

**Recommended:**

- **Before schema changes:** Always backup before running migrations
- **Weekly:** For general debugging purposes
- **Before major deployments:** Safety net for rollback scenarios

**Not recommended:**

- Daily automated backups (Cloud SQL already does this)
- Backing up on every local development session

### 2. Backup Retention

**Cloud Storage:**

- ✅ 30-day automatic retention (configured)
- ✅ Old backups auto-deleted
- ✅ No manual cleanup needed

**Local:**

- ⚠️ No automatic cleanup
- 💡 Manually delete old backups:
  ```bash
  # Delete backups older than 7 days
  find backups/ -name "*.sql.gz" -mtime +7 -delete
  ```

### 3. Security Considerations

**DO:**

- ✅ Keep backup files local only (don't commit to Git)
- ✅ Delete backups when no longer needed
- ✅ Use read-only Cloud SQL user for backups (future enhancement)

**DON'T:**

- ❌ Commit backup files to Git (`.gitignore` prevents this)
- ❌ Share backup files via public channels
- ❌ Store backups in cloud services (Dropbox, Google Drive, etc.)

### 4. Testing Migrations

When testing a migration with production data:

1. **Backup first**

   ```bash
   pnpm db:backup
   ```

2. **Restore to local**

   ```bash
   pnpm db:restore
   ```

3. **Create migration**

   ```bash
   pnpm --filter api db:generate
   ```

4. **Test migration locally**

   ```bash
   pnpm --filter api db:migrate
   ```

5. **If successful, deploy**

   ```bash
   git add apps/api/src/database/migrations/
   git commit -m "feat: add migration"
   git push
   ```

6. **If failed, reset and fix**
   ```bash
   pnpm db:reset  # Start fresh
   # Fix migration
   # Repeat from step 3
   ```

---

## Storage Management

### Check Backup Storage Usage

```bash
# Cloud Storage
gsutil du -sh gs://chamuco-db-backups/backups/

# Local
du -sh backups/
```

### List All Backups

**Cloud Storage:**

```bash
gsutil ls -l gs://chamuco-db-backups/backups/
```

**Local:**

```bash
ls -lh backups/
```

### Delete Specific Backup

**Cloud Storage:**

```bash
gsutil rm gs://chamuco-db-backups/backups/chamuco_prod_20260301_120000.sql.gz
```

**Local:**

```bash
rm backups/chamuco_prod_20260301_120000.sql.gz
```

### Delete All Old Backups

**Local (keep last 3):**

```bash
ls -t backups/*.sql.gz | tail -n +4 | xargs rm
```

---

## Lifecycle Policy

Backups in Cloud Storage are automatically deleted after 30 days.

**Policy configuration:** `infrastructure/gcp/lifecycle.json`

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "matchesPrefix": ["backups/"]
        }
      }
    ]
  }
}
```

**To update retention period:**

1. Edit `infrastructure/gcp/lifecycle.json`
2. Apply new policy:
   ```bash
   gsutil lifecycle set infrastructure/gcp/lifecycle.json gs://chamuco-db-backups
   ```

---

## Quick Reference

```bash
# Backup production → local
pnpm db:backup

# Restore local from production backup
pnpm db:restore

# List local backups
ls -lh backups/

# List Cloud Storage backups
gsutil ls -l gs://chamuco-db-backups/backups/

# Check backup file size
du -h backups/chamuco_prod_*.sql.gz

# Decompress backup (without importing)
gunzip -c backups/chamuco_prod_20260328_164500.sql.gz > backup.sql

# Verify backup integrity
gunzip -t backups/chamuco_prod_20260328_164500.sql.gz
```

---

## Related Documentation

- [Local Development Guide](./local-development.md) — Docker Compose workflow
- [Cloud SQL Setup Guide](./cloud-sql-setup.md) — Production database configuration
- [Cloud SQL Config](./cloud-sql-config.md) — Project-specific connection strings
