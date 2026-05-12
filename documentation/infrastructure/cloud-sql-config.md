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
**Production URL:** `https://api.chamucotravel.com`
**Internal Cloud Run URL:** `https://chamuco-api-393715267650.us-central1.run.app`

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
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest,GEONAMES_USERNAME=GEONAMES_USERNAME:latest,GITHUB_TOKEN=GITHUB_TOKEN:latest,GOOGLE_CLOUD_STORAGE_BUCKET=GOOGLE_CLOUD_STORAGE_BUCKET:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300 \
  --port=3000 \
  --allow-unauthenticated \
  --ingress=all \
  --no-use-http2 \
  --execution-environment=gen2 \
  --project=chamuco-app-mn
```

**Notes:**

- `DATABASE_URL` is **not a secret** in Cloud Run — `drizzle.provider.ts` uses hardcoded Unix socket config when `K_SERVICE` is set. The IAM token is fetched dynamically from the metadata server.
- `--execution-environment=gen2` and `--no-use-http2` are **required** — omitting them on any deploy reverts to GCP defaults silently.
- `--set-secrets` **replaces** all secret bindings on each deploy (not additive). Keep this list authoritative.

### Database Connection from Cloud Run

The NestJS API connects to Cloud SQL via **Unix socket**. In production (`NODE_ENV=production` + `K_SERVICE` set by Cloud Run), `drizzle.provider.ts` hardcodes the connection — `DATABASE_URL` is not used and not required.

**Connection config (production):**

```ts
host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres';
database: 'chamuco_prod';
user: 'chamuco-api-sa@chamuco-app-mn.iam';
password: async () => fetchIamToken(); // fetched per connection from metadata server
```

**IAM token — must be fetched dynamically, never cached:**

IAM tokens expire after ~1 hour. The `password` option in postgres.js accepts an async function; this is called on each new pool connection so the token is always fresh. Passing `process.env.PGPASSWORD` (a static value set at startup) causes auth failures after ~1 hour as the pool opens new connections.

**Connection flow:**

1. Container starts; `startup.sh` fetches a token and runs `run-migrations.js`
2. `pnpm start:prod` launches NestJS; `drizzle.provider.ts` creates the postgres.js pool
3. On each new connection, the async `password` function calls the GCP metadata server:
   `GET http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`
4. The fresh OAuth2 token is used as the PostgreSQL password
5. Cloud SQL validates the token against the IAM user `chamuco-api-sa@chamuco-app-mn.iam`

**Benefits:**

- No static secrets — IAM handles auth with auto-refreshed tokens
- Lower latency than TCP (Unix socket)
- Pool management via Drizzle provider (configurable via `DATABASE_POOL_MAX`)

### CI/CD Pipeline

Full pipeline implemented in `.github/workflows/api.yml` (Issue #19).

**Migrations do NOT run in GitHub Actions.** GitHub Actions has no access to the Cloud SQL private VPC. Migrations are applied by `apps/api/scripts/startup.sh` inside the container at boot, before NestJS starts. If migrations fail, the container exits with code 1 and Cloud Run keeps the previous revision live.

```
Container startup sequence:
  startup.sh
    └── get-iam-token.js  (fetches OAuth2 token with sqlservice.login scope)
    └── run-migrations.js (applies pending SQL files via pg client + PGPASSWORD)
    └── pnpm start:prod   (NestJS; drizzle.provider.ts fetches tokens dynamically)
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
