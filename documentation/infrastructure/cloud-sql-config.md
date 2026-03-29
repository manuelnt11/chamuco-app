# Cloud SQL Configuration - chamuco-app-mn

**Date Configured:** 2026-03-28
**Project ID:** `chamuco-app-mn`

---

## Instance Details

| Property             | Value                                         |
| -------------------- | --------------------------------------------- |
| **Instance Name**    | `chamuco-postgres`                            |
| **Connection Name**  | `chamuco-app-mn:us-central1:chamuco-postgres` |
| **Database Version** | PostgreSQL 16                                 |
| **Edition**          | ENTERPRISE                                    |
| **Tier**             | db-f1-micro (0.6 GB RAM, shared CPU)          |
| **Region**           | us-central1-c                                 |
| **Private IP**       | 10.34.0.3                                     |
| **Public IP**        | None (private IP only)                        |
| **Status**           | RUNNABLE ✅                                   |

---

## Database & Users

### Production Database

- **Name:** `chamuco_prod`
- **Character Set:** UTF8
- **Collation:** en_US.UTF8

### Users Configured

| User                                | Type                      | Purpose                       |
| ----------------------------------- | ------------------------- | ----------------------------- |
| `postgres`                          | BUILT_IN                  | Management & admin tasks      |
| `chamuco-api-sa@chamuco-app-mn.iam` | CLOUD_IAM_SERVICE_ACCOUNT | Cloud Run API service account |

---

## VPC Networking

### VPC Peering

- **Status:** Active
- **Network:** `default`
- **Allocated Range:** `google-managed-services-default` (managed by Google)

### VPC Serverless Connector

- **Name:** `chamuco-vpc-connector`
- **Region:** us-central1
- **Network:** default
- **IP Range:** 10.8.0.0/28 (16 IPs)
- **Min Instances:** 2
- **Max Instances:** 10
- **Machine Type:** e2-micro
- **Status:** READY ✅

---

## IAM Configuration

### Service Account

- **Email:** `chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com`
- **Display Name:** Chamuco API Service Account
- **Roles:**
  - `roles/cloudsql.client` (for Cloud SQL connection)

### Developer Access

- **User:** `manuelnt11@gmail.com`
- **Roles:**
  - `roles/owner` (project owner)
  - `roles/cloudsql.client` (for local debugging via proxy)

---

## Connection Strings

### Production (Cloud Run)

```bash
DATABASE_URL=postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Local Development (Docker)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chamuco_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Local → Production (via Cloud SQL Auth Proxy)

```bash
# Start proxy
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433

# Connection string
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod
```

---

## Backup Configuration

### Automated Backups

- **Enabled:** Yes
- **Start Time:** 03:00 UTC (daily)
- **Retained Backups:** 7 days
- **Point-in-Time Recovery:** Enabled
- **Transaction Log Retention:** 7 days

### Manual Backup

```bash
gcloud sql backups create \
  --instance=chamuco-postgres \
  --description="Manual backup - $(date +%Y-%m-%d)"
```

### List Backups

```bash
gcloud sql backups list --instance=chamuco-postgres
```

### Restore from Backup

```bash
gcloud sql backups restore BACKUP_ID \
  --backup-instance=chamuco-postgres
```

---

## Cost Estimate

### Monthly Costs (MVP Tier)

| Component                  | Cost              |
| -------------------------- | ----------------- |
| Cloud SQL db-f1-micro      | ~$10/month        |
| Storage (10 GB SSD)        | ~$1.70/month      |
| Backups (7 days)           | ~$0.80/month      |
| VPC Connector (2 e2-micro) | ~$12/month        |
| **Total**                  | **~$24.50/month** |

### Upgrade Path (Production Tier)

When ready to scale, upgrade to:

- **Tier:** `db-custom-1-3840` (1 vCPU, 3.75 GB RAM)
- **Storage:** 50 GB SSD
- **Estimated Cost:** ~$74/month (including VPC connector)

---

## Deployment Configuration

**Status:** Deployed (Issue #19 - 2026-03-29)
**Service URL:** `https://chamuco-api-393715267650.us-central1.run.app`

### Cloud Run Deploy Command

```bash
gcloud run deploy chamuco-api \
  --image=us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:latest \
  --region=us-central1 \
  --platform=managed \
  --service-account=chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com \
  --add-cloudsql-instances=chamuco-app-mn:us-central1:chamuco-postgres \
  --vpc-connector=chamuco-vpc-connector \
  --vpc-egress=private-ranges-only \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,DATABASE_POOL_MIN=DATABASE_POOL_MIN:latest,DATABASE_POOL_MAX=DATABASE_POOL_MAX:latest,NODE_ENV=NODE_ENV:latest,SWAGGER_ENABLED=SWAGGER_ENABLED:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60s \
  --port=3000 \
  --allow-unauthenticated \
  --ingress=all \
  --no-use-http2 \
  --execution-environment=gen2 \
  --project=chamuco-app-mn
```

**Key Changes from Design:**

- ✅ Using **Artifact Registry** (`us-central1-docker.pkg.dev`) instead of Container Registry
- ✅ Using **Secret Manager** (`--set-secrets`) instead of `--set-env-vars` for sensitive data
- ✅ Added **VPC egress** control (`private-ranges-only`) for security
- ✅ Set explicit **resource limits** (512Mi RAM, 1 CPU) and **scaling** (0-10 instances)
- ✅ Using **gen2 execution environment** for faster cold starts
- ✅ Service name is `chamuco-api` (not just `api`)

### Database Connection from Cloud Run

The NestJS API connects to Cloud SQL via **Unix socket** using the connection string stored in Secret Manager:

```bash
postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres
```

**Connection flow:**

1. Cloud Run container starts and reads `DATABASE_URL` from Secret Manager
2. Drizzle provider parses the connection string and detects Unix socket format
3. `postgres.js` client connects via `/cloudsql/PROJECT:REGION:INSTANCE` socket
4. Cloud SQL instance authenticates the service account via IAM
5. Connection is established over encrypted Unix socket (no TCP/IP)

**Benefits:**

- No passwords or secrets in environment variables (IAM handles auth)
- Lower latency than TCP connection
- Automatic reconnection if connection drops
- Pool management via Drizzle provider (2-10 connections per instance)

### CI/CD Pipeline

Full pipeline implemented in `.github/workflows/api.yml` (Issue #19).

**Migration step** (runs before deployment):

```yaml
- name: Run Database Migrations
  if: github.ref == 'refs/heads/main'
  run: |
    # Download and start Cloud SQL Proxy
    wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
    chmod +x cloud_sql_proxy
    ./cloud_sql_proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &
    PROXY_PID=$!
    sleep 5

    # Run migrations
    DATABASE_URL=postgresql://github-actions@chamuco-app-mn.iam@localhost:5433/chamuco_prod \
      pnpm --filter api db:migrate

    # Stop proxy
    kill $PROXY_PID
```

**Note:** The `github-actions` IAM service account is used for CI/CD operations and has `roles/cloudsql.client` and `roles/iam.serviceAccountUser` permissions.

---

## Common Operations

### Connect via Cloud SQL Auth Proxy

```bash
# Start proxy (runs in foreground)
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433

# Or run in background
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &

# Stop background proxy
pkill cloud-sql-proxy
```

### Run Migrations on Production

```bash
# Start proxy
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &

# Run migrations
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod \
  pnpm --filter api db:migrate

# Stop proxy
pkill cloud-sql-proxy
```

### Open Drizzle Studio on Production

```bash
# Start proxy
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &

# Open Drizzle Studio (update apps/api/.env first)
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod \
  pnpm --filter api db:studio

# Stop proxy when done
pkill cloud-sql-proxy
```

### View Instance Status

```bash
gcloud sql instances describe chamuco-postgres
```

### View Connection Logs

```bash
gcloud sql operations list --instance=chamuco-postgres --limit=10
```

---

## Security Notes

### Network Security

- ✅ Private IP only (no public IP assigned)
- ✅ VPC peering configured for Google services
- ✅ VPC Serverless Connector for Cloud Run access
- ✅ No direct internet access to database

### Authentication

- ✅ IAM-based authentication (no passwords for service accounts)
- ✅ Application Default Credentials for local development
- ✅ Service account with least privilege (cloudsql.client only)

### Encryption

- ✅ Data at rest: Encrypted by default (Google-managed keys)
- ✅ Data in transit: TLS 1.2+ enforced
- ✅ Unix socket: Encrypted connection from Cloud Run

---

## Troubleshooting

### Issue: Cannot connect via proxy

**Error:** `credentials: could not find default credentials`

**Solution:**

```bash
gcloud auth application-default login
```

### Issue: Permission denied

**Error:** `PERMISSION_DENIED`

**Solution:** Verify IAM roles:

```bash
gcloud projects get-iam-policy chamuco-app-mn \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/cloudsql.client"
```

### Issue: Connection timeout from Cloud Run

**Check VPC connector:**

```bash
gcloud compute networks vpc-access connectors describe chamuco-vpc-connector \
  --region=us-central1
```

**Verify Cloud Run has connector attached:**

```bash
gcloud run services describe api --region=us-central1 \
  --format="value(spec.template.spec.containers[0].resources.limits)"
```

---

## Monitoring

### Cloud SQL Monitoring Dashboards

- **GCP Console:** https://console.cloud.google.com/sql/instances/chamuco-postgres?project=chamuco-app-mn
- **Operations:** Operations tab shows recent activity
- **Monitoring:** Built-in metrics for CPU, memory, connections, storage

### Key Metrics to Watch

- **CPU Utilization:** Should stay < 80% (upgrade tier if consistently high)
- **Memory Utilization:** Should stay < 80%
- **Active Connections:** Monitor for connection leaks
- **Storage Utilization:** Auto-increases enabled, but monitor growth

---

## Related Documentation

- [Cloud SQL Setup Guide](documentation/infrastructure/cloud-sql-setup.md)
- [Local Development Guide](documentation/infrastructure/local-development.md)
- [Cloud Infrastructure Overview](documentation/infrastructure/cloud.md)
