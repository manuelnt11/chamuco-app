# Cloud SQL Setup Guide

**Status:** Documentation
**Last Updated:** 2026-03-28

This guide covers the complete provisioning and configuration of Cloud SQL PostgreSQL for Chamuco App's production environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Cloud SQL Instance](#create-cloud-sql-instance)
3. [Create Database and User](#create-database-and-user)
4. [VPC Connector Setup](#vpc-connector-setup)
5. [IAM Roles Configuration](#iam-roles-configuration)
6. [Cloud Run Integration](#cloud-run-integration)
7. [Environment Variables](#environment-variables)
8. [Cloud SQL Auth Proxy](#cloud-sql-auth-proxy-for-local-development)
9. [Verification Steps](#verification-steps)
10. [Cost Management](#cost-management)
11. [Backup Strategy](#backup-strategy)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

1. **GCP Project Created**
   - Project ID chosen (e.g., `chamuco-prod`)
   - Billing account linked and billing enabled

2. **gcloud CLI Installed and Authenticated**

   ```bash
   # Install gcloud CLI (macOS)
   brew install google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install

   # Authenticate
   gcloud auth login

   # Set project
   gcloud config set project PROJECT_ID

   # Verify authentication
   gcloud auth list
   ```

3. **Required APIs Enabled**

   ```bash
   # Enable Cloud SQL Admin API
   gcloud services enable sqladmin.googleapis.com

   # Enable Compute Engine API (for VPC)
   gcloud services enable compute.googleapis.com

   # Enable Service Networking API (for private IP)
   gcloud services enable servicenetworking.googleapis.com

   # Enable Cloud Run API
   gcloud services enable run.googleapis.com

   # Verify enabled services
   gcloud services list --enabled | grep -E 'sqladmin|compute|servicenetworking|run'
   ```

4. **IAM Permissions**
   - You need the following roles on the project:
     - `roles/cloudsql.admin` — Manage Cloud SQL instances
     - `roles/compute.networkAdmin` — Create VPC connectors
     - `roles/iam.serviceAccountAdmin` — Manage service accounts
     - `roles/resourcemanager.projectIamAdmin` — Grant IAM roles

---

## Create Cloud SQL Instance

### Option 1: Using gcloud CLI (Recommended)

```bash
# Set variables (customize for your project)
export PROJECT_ID="chamuco-prod"
export REGION="us-central1"
export INSTANCE_NAME="chamuco-postgres"
export DB_VERSION="POSTGRES_16"
export TIER="db-f1-micro"  # Upgrade to db-custom-1-3840 for production

# Create Cloud SQL instance with private IP only
gcloud sql instances create $INSTANCE_NAME \
  --database-version=$DB_VERSION \
  --tier=$TIER \
  --region=$REGION \
  --network=default \
  --no-assign-ip \
  --database-flags=max_connections=100 \
  --availability-type=zonal \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --storage-auto-increase-limit=100 \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery \
  --retained-backups-count=7 \
  --transaction-log-retention-days=7
```

**Configuration Explained:**

| Flag                               | Value                 | Rationale                                                                                              |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `--database-version`               | `POSTGRES_16`         | Matches local Docker (postgres:16-alpine)                                                              |
| `--tier`                           | `db-f1-micro`         | MVP tier (0.6 GB RAM, shared CPU). Upgrade to `db-custom-1-3840` (1 vCPU, 3.75 GB RAM) for production. |
| `--region`                         | `us-central1`         | Choose region closest to users. Options: `us-east1`, `us-west1`, `europe-west1`, `asia-southeast1`     |
| `--network`                        | `default`             | Use default VPC. For production, create dedicated VPC.                                                 |
| `--no-assign-ip`                   | (flag)                | **Security**: Private IP only, no public internet access                                               |
| `--database-flags`                 | `max_connections=100` | Connection pool limit. Adjust based on tier and workload.                                              |
| `--availability-type`              | `zonal`               | Single-zone (cheaper). Use `regional` for HA in production.                                            |
| `--storage-type`                   | `SSD`                 | Required for good performance                                                                          |
| `--storage-size`                   | `10GB`                | Initial size. Auto-increases up to limit.                                                              |
| `--backup-start-time`              | `03:00`               | Daily automated backup at 3 AM (UTC)                                                                   |
| `--enable-point-in-time-recovery`  | (flag)                | Enables transaction logs for restore to any point within retention period                              |
| `--retained-backups-count`         | `7`                   | Keep 7 daily backups                                                                                   |
| `--transaction-log-retention-days` | `7`                   | 7-day point-in-time recovery window                                                                    |

**Creation takes 5-10 minutes.** Monitor progress:

```bash
gcloud sql operations list --instance=$INSTANCE_NAME --limit=1
```

### Option 2: Using GCP Console

1. Navigate to **SQL** in GCP Console
2. Click **CREATE INSTANCE** → **Choose PostgreSQL**
3. Configure:
   - **Instance ID:** `chamuco-postgres`
   - **Password:** (generate strong password for `postgres` user)
   - **Database version:** PostgreSQL 16
   - **Region:** `us-central1` (or your preferred region)
   - **Zonal availability:** Single zone (MVP) or Multi-zone (production)
4. **Customize Configuration:**
   - **Machine type:** Lightweight (`db-f1-micro` for MVP)
   - **Storage:**
     - Type: SSD
     - Size: 10 GB
     - Enable automatic storage increases
   - **Connections:**
     - **Uncheck** "Public IP"
     - **Check** "Private IP"
     - Select network: `default`
   - **Backups:**
     - Enable automated backups
     - Backup time: 03:00
     - Point-in-time recovery: Enabled
     - Retention: 7 days
5. Click **CREATE INSTANCE**

---

## Create Database and User

### Create Production Database

```bash
# Create database
gcloud sql databases create chamuco_prod \
  --instance=$INSTANCE_NAME

# Verify
gcloud sql databases list --instance=$INSTANCE_NAME
```

### Create Service Account User for Cloud Run

**Important:** Cloud Run will authenticate to Cloud SQL using a **Cloud IAM service account**, not a traditional PostgreSQL username/password.

```bash
# Create service account
gcloud iam service-accounts create chamuco-api-sa \
  --display-name="Chamuco API Service Account" \
  --description="Service account for NestJS API to connect to Cloud SQL"

# Create Cloud SQL user linked to service account
gcloud sql users create chamuco-api-sa@$PROJECT_ID.iam \
  --instance=$INSTANCE_NAME \
  --type=CLOUD_IAM_SERVICE_ACCOUNT

# Verify
gcloud sql users list --instance=$INSTANCE_NAME
```

**Output should show:**

- `postgres` (built-in superuser, password-based)
- `chamuco-api-sa@PROJECT_ID.iam` (IAM authentication)

---

## VPC Connector Setup

Cloud Run needs a **VPC Serverless Connector** to access Cloud SQL's private IP.

### Create VPC Connector

```bash
# Create connector (takes 2-3 minutes)
gcloud compute networks vpc-access connectors create chamuco-vpc-connector \
  --region=$REGION \
  --network=default \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=10 \
  --machine-type=e2-micro

# Verify status
gcloud compute networks vpc-access connectors describe chamuco-vpc-connector \
  --region=$REGION
```

**Configuration Explained:**

| Flag              | Value         | Rationale                                                                       |
| ----------------- | ------------- | ------------------------------------------------------------------------------- |
| `--range`         | `10.8.0.0/28` | 16 IP addresses reserved for connector. Must not overlap with existing subnets. |
| `--min-instances` | `2`           | Always-on instances for low latency                                             |
| `--max-instances` | `10`          | Auto-scales under load                                                          |
| `--machine-type`  | `e2-micro`    | Smallest machine type (sufficient for most workloads)                           |

**Status should be:** `READY`

---

## IAM Roles Configuration

Grant the Cloud Run service account permission to connect to Cloud SQL.

```bash
# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:chamuco-api-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/cloudsql.client

# Verify
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/cloudsql.client"
```

**Output should include:**

```
serviceAccount:chamuco-api-sa@PROJECT_ID.iam.gserviceaccount.com
```

---

## Cloud Run Integration

### Get Cloud SQL Connection Name

```bash
# Format: PROJECT_ID:REGION:INSTANCE_NAME
gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)"
```

**Example output:** `chamuco-prod:us-central1:chamuco-postgres`

### Deploy or Update Cloud Run Service

When deploying the NestJS API to Cloud Run, include these flags:

```bash
# Deploy with Cloud SQL connection and VPC connector
gcloud run deploy api \
  --image=gcr.io/$PROJECT_ID/api:latest \
  --region=$REGION \
  --platform=managed \
  --service-account=chamuco-api-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$INSTANCE_NAME \
  --vpc-connector=chamuco-vpc-connector \
  --set-env-vars="DATABASE_URL=postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME" \
  --set-env-vars="DATABASE_POOL_MIN=2,DATABASE_POOL_MAX=10" \
  --allow-unauthenticated
```

**Key flags:**

- `--add-cloudsql-instances` — Makes Cloud SQL instance available via unix socket
- `--vpc-connector` — Routes traffic through VPC connector to private IP
- `--service-account` — Uses IAM service account for authentication
- `--set-env-vars` — Sets DATABASE_URL with unix socket path

---

## Environment Variables

### Production DATABASE_URL Format

**For Cloud Run (recommended):**

```bash
DATABASE_URL=postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

**Breakdown:**

- **User:** `chamuco-api-sa` (no `@PROJECT_ID.iam` suffix in connection string)
- **Password:** (omitted, IAM authentication)
- **Host:** Unix socket path `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`
- **Database:** `chamuco_prod`

### Store in Secret Manager (Recommended)

```bash
# Create secret
echo -n "postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME" | \
  gcloud secrets create database-url --data-file=-

# Grant Cloud Run service account access to secret
gcloud secrets add-iam-policy-binding database-url \
  --member=serviceAccount:chamuco-api-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Deploy Cloud Run with secret
gcloud run deploy api \
  --image=gcr.io/$PROJECT_ID/api:latest \
  --update-secrets=DATABASE_URL=database-url:latest
```

---

## Cloud SQL Auth Proxy for Local Development

The **Cloud SQL Auth Proxy** allows you to connect to the production database from your local machine for debugging (read-only operations recommended).

### Install Cloud SQL Auth Proxy

**macOS:**

```bash
brew install cloud-sql-proxy
```

**Linux / Manual:**

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### Authenticate

```bash
# Authenticate with your user account (not service account)
gcloud auth application-default login

# Grant yourself Cloud SQL Client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:YOUR_EMAIL@gmail.com \
  --role=roles/cloudsql.client
```

### Start Proxy

```bash
# Start proxy on port 5433 (avoids conflict with local Docker on 5432)
cloud-sql-proxy $PROJECT_ID:$REGION:$INSTANCE_NAME --port=5433
```

**Output:**

```
2026-03-28T16:00:00.000Z Listening on 127.0.0.1:5433
2026-03-28T16:00:00.000Z Ready for new connections
```

### Connect from Local

**Option 1: Update local .env**

```bash
# apps/api/.env
DATABASE_URL=postgresql://YOUR_EMAIL@localhost:5433/chamuco_prod
```

**Option 2: Use psql directly**

```bash
psql "postgresql://YOUR_EMAIL@localhost:5433/chamuco_prod"
```

**Option 3: Use Drizzle Studio**

```bash
# In apps/api/.env, set:
DATABASE_URL=postgresql://YOUR_EMAIL@localhost:5433/chamuco_prod

# Then run:
pnpm --filter api db:studio
```

**⚠️ Warning:** The proxy gives you full database access. Use caution and prefer read-only operations. Consider creating a read-only database user for debugging.

### Create Read-Only User (Recommended)

```bash
# Connect to Cloud SQL via proxy as postgres superuser
psql "postgresql://postgres@localhost:5433/chamuco_prod"

-- Create read-only role
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE chamuco_prod TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

\q
```

**Then use:**

```bash
DATABASE_URL=postgresql://readonly_user:secure_password_here@localhost:5433/chamuco_prod
```

---

## Verification Steps

### 1. Verify Instance Status

```bash
gcloud sql instances describe $INSTANCE_NAME
```

**Check:**

- `state: RUNNABLE`
- `databaseVersion: POSTGRES_16`
- `ipAddresses` contains only private IP (10.x.x.x)

### 2. Verify VPC Connector

```bash
gcloud compute networks vpc-access connectors describe chamuco-vpc-connector --region=$REGION
```

**Check:**

- `state: READY`
- `ipCidrRange: 10.8.0.0/28`

### 3. Verify IAM Permissions

```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/cloudsql.client"
```

**Check:**

- Service account `chamuco-api-sa@PROJECT_ID.iam.gserviceaccount.com` is listed

### 4. Test Connection via Proxy

```bash
# Start proxy
cloud-sql-proxy $PROJECT_ID:$REGION:$INSTANCE_NAME --port=5433 &

# Test connection
psql "postgresql://postgres@localhost:5433/chamuco_prod" -c "SELECT version();"
```

**Expected output:**

```
PostgreSQL 16.x on x86_64-pc-linux-gnu, compiled by gcc...
```

### 5. Test Cloud Run Connection

```bash
# Deploy a test version
gcloud run deploy api --image=gcr.io/$PROJECT_ID/api:latest ...

# Check logs for database connection
gcloud run services logs read api --region=$REGION --limit=50 | grep -i "database\|connection"
```

**Success indicators:**

- No "connection refused" errors
- No "authentication failed" errors
- API health check returns 200

---

## Cost Management

### Cost Breakdown (Approximate)

**Cloud SQL db-f1-micro (MVP):**

- Instance: ~$7.50/month
- Storage (10 GB SSD): ~$1.70/month
- Backups (7 days): ~$0.80/month
- **Total: ~$10/month**

**Cloud SQL db-custom-1-3840 (Production):**

- Instance (1 vCPU, 3.75 GB RAM): ~$50/month
- Storage (50 GB SSD): ~$8.50/month
- Backups (7 days): ~$4/month
- **Total: ~$62/month**

**VPC Connector:**

- 2 min instances: ~$12/month
- Additional instances (on-demand): ~$0.01/minute

**Total MVP cost: ~$22/month**
**Total Production cost: ~$74/month**

### Cost Optimization

1. **Start small:** Use `db-f1-micro` for MVP, upgrade only when needed
2. **Enable auto-scaling:** Storage auto-increases, but set a limit to prevent surprises
3. **Backup retention:** 7 days is sufficient for most use cases
4. **Point-in-time recovery:** Only enable if you need sub-hour recovery granularity
5. **Regional HA:** Only enable for production (doubles instance cost)
6. **Idle timeout:** Drizzle provider is already configured with 20s idle timeout for Cloud Run

### Set Billing Alerts

```bash
# Create budget alert at 50% and 90% of monthly limit
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Chamuco Cloud SQL Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

---

## Backup Strategy

### Automated Backups (Already Configured)

- **Daily backups:** 3:00 AM UTC
- **Retention:** 7 days
- **Point-in-time recovery:** Enabled (7-day window)

### Manual Backup

```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=$INSTANCE_NAME \
  --description="Manual backup before schema migration"

# List backups
gcloud sql backups list --instance=$INSTANCE_NAME

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=$INSTANCE_NAME \
  --backup-id=BACKUP_ID
```

### Export to Cloud Storage (For Long-Term Retention)

See Phase 3 documentation: `documentation/infrastructure/backup-restore.md`

---

## Troubleshooting

### Issue: "Connection refused" from Cloud Run

**Cause:** VPC connector not attached or Cloud SQL instance not added to Cloud Run.

**Fix:**

```bash
gcloud run services update api \
  --vpc-connector=chamuco-vpc-connector \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$INSTANCE_NAME
```

### Issue: "Authentication failed for user"

**Cause:** IAM authentication not working.

**Fix:**

```bash
# Verify Cloud SQL user exists
gcloud sql users list --instance=$INSTANCE_NAME

# Verify IAM role
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/cloudsql.client"

# Recreate user if missing
gcloud sql users create chamuco-api-sa@$PROJECT_ID.iam \
  --instance=$INSTANCE_NAME \
  --type=CLOUD_IAM_SERVICE_ACCOUNT
```

### Issue: "Cannot connect to Cloud SQL proxy locally"

**Cause:** User doesn't have Cloud SQL Client role.

**Fix:**

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:YOUR_EMAIL@gmail.com \
  --role=roles/cloudsql.client
```

### Issue: "Max connections exceeded"

**Cause:** Too many concurrent connections.

**Fix:**

```bash
# Increase max_connections
gcloud sql instances patch $INSTANCE_NAME \
  --database-flags=max_connections=200

# Adjust connection pool in apps/api/.env
DATABASE_POOL_MAX=5  # Lower for Cloud Run (serverless scales horizontally)
```

### Issue: High latency from Cloud Run

**Cause:** VPC connector bottleneck.

**Fix:**

```bash
# Increase max instances on VPC connector
gcloud compute networks vpc-access connectors update chamuco-vpc-connector \
  --region=$REGION \
  --max-instances=20
```

---

## Next Steps

After Cloud SQL is provisioned:

1. **Run migrations on production:**

   ```bash
   # Via Cloud SQL Auth Proxy
   cloud-sql-proxy $PROJECT_ID:$REGION:$INSTANCE_NAME --port=5433 &
   DATABASE_URL=postgresql://postgres@localhost:5433/chamuco_prod pnpm --filter api db:migrate
   ```

2. **Deploy API to Cloud Run:**
   - See `.github/workflows/api.yml` (when implemented)
   - Migrations run automatically before deployment in CI/CD

3. **Set up backup/restore workflow:**
   - See Phase 3: `documentation/infrastructure/backup-restore.md` (when implemented)

4. **Monitor database performance:**
   - GCP Console → SQL → chamuco-postgres → Monitoring
   - Set up alerts for CPU, memory, connections

---

## References

- [Cloud SQL for PostgreSQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [VPC Serverless Connectors](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access)
- [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud SQL IAM Authentication](https://cloud.google.com/sql/docs/postgres/authentication)
- [Drizzle Provider Configuration](../../apps/api/src/database/drizzle.provider.ts)
