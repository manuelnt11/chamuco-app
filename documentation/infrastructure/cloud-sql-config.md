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

### Cloud Run Deploy Command

```bash
gcloud run deploy api \
  --image=gcr.io/chamuco-app-mn/api:latest \
  --region=us-central1 \
  --platform=managed \
  --service-account=chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com \
  --add-cloudsql-instances=chamuco-app-mn:us-central1:chamuco-postgres \
  --vpc-connector=chamuco-vpc-connector \
  --set-env-vars="DATABASE_URL=postgresql://chamuco-api-sa@/chamuco_prod?host=/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres" \
  --set-env-vars="DATABASE_POOL_MIN=2,DATABASE_POOL_MAX=10" \
  --set-env-vars="NODE_ENV=production" \
  --allow-unauthenticated
```

### CI/CD Pipeline

Add to `.github/workflows/api.yml` before deployment step:

```yaml
- name: Run Database Migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
  run: |
    # Start Cloud SQL Auth Proxy
    cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &
    PROXY_PID=$!

    # Wait for proxy to be ready
    sleep 5

    # Run migrations
    pnpm --filter api db:migrate

    # Stop proxy
    kill $PROXY_PID
```

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
