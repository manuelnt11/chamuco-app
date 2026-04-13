# GCP — Chamuco App

You are helping with Google Cloud Platform operations for the **Chamuco App** project. You already know the full infrastructure — do not ask the user to explain it.

## Project reference (memorize this, never ask the user)

| Key                     | Value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Project ID              | `chamuco-app-mn`                                           |
| Region                  | `us-central1`                                              |
| Cloud SQL instance      | `chamuco-postgres`                                         |
| Cloud SQL connection    | `chamuco-app-mn:us-central1:chamuco-postgres`              |
| Cloud SQL DB (prod)     | `chamuco_prod`                                             |
| Cloud SQL private IP    | `10.34.0.3`                                                |
| VPC connector           | `chamuco-vpc-connector`                                    |
| API service (Cloud Run) | `chamuco-api`                                              |
| Web service (Cloud Run) | `chamuco-web`                                              |
| API service URL         | `https://chamuco-api-393715267650.us-central1.run.app`     |
| Web service URL         | `https://chamuco-web-393715267650.us-central1.run.app`     |
| Artifact Registry       | `us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images` |
| API service account     | `chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com`    |
| Owner email             | `manuelnt11@gmail.com`                                     |

## Authentication notes

- The user authenticates locally via `gcloud auth application-default login`.
- The API uses IAM auth (service account, no password).
- Local → production DB access requires Cloud SQL Auth Proxy on port 5433.
- Proxy command: `cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433`

## Common operations — use these exact commands

### View logs

```bash
# API logs (last 100 lines)
gcloud run services logs read chamuco-api --region=us-central1 --limit=100 --project=chamuco-app-mn

# Web logs
gcloud run services logs read chamuco-web --region=us-central1 --limit=100 --project=chamuco-app-mn
```

### Service status

```bash
# Service details
gcloud run services describe chamuco-api --region=us-central1 --project=chamuco-app-mn
gcloud run services describe chamuco-web --region=us-central1 --project=chamuco-app-mn

# List revisions
gcloud run revisions list --service=chamuco-api --region=us-central1 --project=chamuco-app-mn
gcloud run revisions list --service=chamuco-web --region=us-central1 --project=chamuco-app-mn

# Health check
curl -sf https://chamuco-api-393715267650.us-central1.run.app/health
```

### Rollback

```bash
# Rollback API to a specific SHA image
gcloud run deploy chamuco-api \
  --image=us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:<SHA> \
  --region=us-central1 \
  --project=chamuco-app-mn
```

### Cloud SQL

```bash
# Instance status
gcloud sql instances describe chamuco-postgres --project=chamuco-app-mn

# Recent operations
gcloud sql operations list --instance=chamuco-postgres --limit=10 --project=chamuco-app-mn

# Start proxy (background)
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &

# Stop proxy
pkill cloud-sql-proxy

# Manual backup
gcloud sql backups create \
  --instance=chamuco-postgres \
  --description="Manual backup - $(date +%Y-%m-%d)" \
  --project=chamuco-app-mn

# List backups
gcloud sql backups list --instance=chamuco-postgres --project=chamuco-app-mn
```

### Run migrations on production (via proxy)

```bash
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod \
  pnpm --filter api db:migrate
pkill cloud-sql-proxy
```

### Open Drizzle Studio on production

```bash
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433 &
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod \
  pnpm --filter api db:studio
# pkill cloud-sql-proxy when done
```

### Secrets Manager

```bash
# List secrets
gcloud secrets list --project=chamuco-app-mn

# View a secret version
gcloud secrets versions access latest --secret=DATABASE_URL --project=chamuco-app-mn

# Add a new secret version
echo -n "<value>" | gcloud secrets versions add <SECRET_NAME> --data-file=- --project=chamuco-app-mn

# Create a new secret
echo -n "<value>" | gcloud secrets create <SECRET_NAME> --data-file=- --project=chamuco-app-mn
```

### Artifact Registry — list images

```bash
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images \
  --include-tags \
  --project=chamuco-app-mn
```

### Monitoring

```bash
# Check VPC connector status
gcloud compute networks vpc-access connectors describe chamuco-vpc-connector \
  --region=us-central1 \
  --project=chamuco-app-mn
```

## How to respond

The user will tell you what they want to do (e.g. "check API logs", "rollback to last deploy", "start the SQL proxy", "add a secret").

- Pick the right command(s) from above.
- If arguments are needed (like a SHA for rollback), ask only for what's missing.
- After running a command, interpret the output and summarize the result clearly.
- If an operation could affect production data or is irreversible, confirm with the user before running.
- Never ask the user to explain what chamuco-api is, what the project ID is, or how Cloud Run works — you already know.

$ARGUMENTS
