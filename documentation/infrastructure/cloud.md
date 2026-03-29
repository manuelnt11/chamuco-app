# Infrastructure: Cloud & Deployment

**Status:** Design Phase → Implementation In Progress
**Last Updated:** 2026-03-28

---

## Cloud Provider

**Google Cloud Platform (GCP)** is the chosen cloud provider. This aligns with the Google SSO authentication strategy and the developer's existing GCP experience.

---

## Key GCP Services

| Service                            | Purpose                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Cloud Run**                      | Containerized backend (NestJS API) and frontend (Next.js). Serverless, auto-scaling, pay-per-use.                          |
| **Cloud SQL**                      | Managed PostgreSQL instance. Source of truth for all relational data. Handles backups, patching, and failover.             |
| **Cloud Storage**                  | File storage for user avatars, trip media, expense receipts, and booking confirmation PDFs.                                |
| **Firebase Authentication**        | Google Sign-In and Passkeys. Managed token issuance, refresh, and revocation.                                              |
| **Firestore**                      | Real-time message storage and delivery for DMs and channels. Synced from PostgreSQL membership data by the NestJS backend. |
| **Firebase Cloud Messaging (FCM)** | Push notifications for mobile and web when the app is in the background.                                                   |
| **GitHub Actions**                 | CI/CD pipelines for automated testing and deployment.                                                                      |
| **Secret Manager**                 | Secure storage for environment variables, API keys, and service account credentials.                                       |
| **Cloud CDN + Load Balancer**      | HTTPS termination, CDN caching for the frontend, traffic routing.                                                          |
| **Artifact Registry**              | Docker image registry for backend and frontend container images.                                                           |
| **Cloud Logging / Monitoring**     | Structured log aggregation and uptime/performance monitoring.                                                              |

---

## Deployment Architecture

```
[User Browser / Mobile App]
          │
          ▼
  [Cloud CDN + Load Balancer]
      │              │
      ▼              ▼
[Cloud Run: API]  [Cloud Run: Web Frontend (SSR)]
      │
      ▼
[Cloud SQL: PostgreSQL]
      │
[Cloud Storage: Files]
```

---

## Environments

| Environment   | Description                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `development` | Local development. Runs against a local PostgreSQL instance or Cloud SQL proxy.              |
| `staging`     | A dedicated GCP project or namespace. Used for QA and pre-release testing.                   |
| `production`  | The live environment. Separate GCP project recommended for billing and permission isolation. |

---

## Cloud SQL Configuration

### Database Infrastructure

**PostgreSQL 16** managed by Cloud SQL serves as the source of truth for all relational data:

- User accounts, profiles, and authentication records
- Trips, groups, participants, and memberships
- Expenses, reservations, and itineraries
- Gamification data (achievements, points, traveler scores)
- Real-time messaging metadata (Firestore is synced from PostgreSQL)

### Connection Architecture

**Production (Cloud Run → Cloud SQL):**

- **Private IP only** (no public IP for security)
- **VPC Serverless Connector** routes traffic from Cloud Run to Cloud SQL's private network
- **IAM Authentication** via service account (no password)
- **Unix socket connection** from Cloud Run: `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`

**Local Development:**

- **Docker Compose** runs PostgreSQL 16 Alpine container
- Port 5432 on localhost
- Managed via `pnpm db:start|stop|reset|logs|psql`

**Local → Production Debugging:**

- **Cloud SQL Auth Proxy** creates encrypted tunnel on port 5433
- Allows local Drizzle Studio or psql to connect to production
- Read-only user recommended for safety

### Instance Configuration

**MVP Tier:**

- Machine type: `db-f1-micro` (0.6 GB RAM, shared CPU)
- Storage: 10 GB SSD (auto-increases to 100 GB limit)
- Availability: Single-zone (zonal)
- Backups: Daily at 3:00 AM UTC, 7-day retention
- Point-in-time recovery: Enabled (7-day window)
- Cost: ~$10/month

**Production Tier (when scaling):**

- Machine type: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM)
- Storage: 50 GB SSD (auto-increases to 200 GB limit)
- Availability: Regional (high availability)
- Backups: Same as MVP
- Cost: ~$62/month

### Connection Pooling

Drizzle provider configured for serverless optimization:

- `idle_timeout: 20s` — Close idle connections (Cloud Run scales to zero)
- `connect_timeout: 10s` — Fail fast if connection unavailable
- `prepare: false` — Disable prepared statements (better for serverless)
- Pool size: 2-10 connections per Cloud Run instance

**Why small pools:** Cloud Run scales horizontally (many instances with few connections each) rather than vertically (one instance with many connections).

### Migrations

**Philosophy:** Migration-first (never use schema push).

All schema changes produce explicit `.sql` files via `drizzle-kit generate`:

- Committed to Git in `apps/api/src/database/migrations/`
- Reviewed in pull requests
- Applied automatically by CI/CD **before** deployment

**CI/CD Order:**

1. Build Docker image
2. Push image to Artifact Registry
3. **Run migrations** via Cloud SQL Auth Proxy ← happens here
4. Deploy new image to Cloud Run ← only if migrations succeed

If migrations fail, deployment is skipped and the old version continues running.

### Backup Strategy

**Automated:**

- Daily backups at 3:00 AM UTC
- 7-day retention (configurable)
- Point-in-time recovery within 7-day window

**Manual:**

- On-demand backups via `gcloud sql backups create`
- Export to Cloud Storage for long-term retention (see Phase 3)

**Restore:**

- From automated backup: `gcloud sql backups restore`
- From Cloud Storage export: Import via `pg_restore`
- Local development: `pnpm db:restore` (see `backup-restore.md`)

### Security

**Network:**

- No public IP assigned (private IP only)
- Accessible only via VPC Serverless Connector from Cloud Run
- Cloud SQL Auth Proxy required for local access

**Authentication:**

- Production: IAM service account (`chamuco-api-sa@PROJECT_ID.iam`)
- Local proxy: User's gcloud credentials
- No passwords stored or transmitted (IAM handles auth)

**Access Control:**

- Cloud Run service account has `roles/cloudsql.client`
- Developers have `roles/cloudsql.client` for proxy access
- Principle of least privilege (no superuser access in production)

**Encryption:**

- Data at rest: Encrypted by default (GCP-managed keys)
- Data in transit: TLS 1.2+ (enforced by Cloud SQL)
- Unix socket: Encrypted connection from Cloud Run

### Complete Setup Guide

See [Cloud SQL Setup Guide](./cloud-sql-setup.md) for step-by-step provisioning instructions including:

- GCP project and API prerequisites
- Instance creation (Console and CLI)
- VPC connector setup
- IAM role configuration
- Cloud Run integration
- Cloud SQL Auth Proxy installation
- Verification steps
- Troubleshooting

---

## Containerization

Both the NestJS API and Next.js web application are packaged as **Docker** containers. The Dockerfiles live in `apps/api/` and `apps/web/` respectively.

Key considerations:

- Multi-stage builds to minimize production image size.
- Non-root user in the container for security.
- Health check endpoint (`/health`) for Cloud Run readiness probes (API).
- Next.js standalone output mode for minimal production bundles (Web).

---

## Cloud Run Configuration

**Status:** Deployed (Issue #19)
**Last Updated:** 2026-03-29

Both services are deployed to Cloud Run in `us-central1` region with serverless, auto-scaling configuration.

### API Service (`chamuco-api`)

**Service URL:** `https://chamuco-api-393715267650.us-central1.run.app`
**Current Revision:** `chamuco-api-00012-tfr` (or latest)

**Configuration:**

```yaml
Image: us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:latest
Region: us-central1
Platform: managed
Service Account: chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com
Cloud SQL Instance: chamuco-app-mn:us-central1:chamuco-postgres
VPC Connector: chamuco-vpc-connector
VPC Egress: private-ranges-only

Resources:
  Memory: 512Mi
  CPU: 1 vCPU
  Min Instances: 0 (scales to zero)
  Max Instances: 10
  Concurrency: 80 requests/instance
  Timeout: 60s
  Port: 3000

Access:
  Authentication: allow-unauthenticated (auth handled by Firebase tokens)
  Ingress: all
  HTTP/2: disabled

Environment:
  Execution Environment: gen2 (faster cold starts)
  PORT: 3000 (Cloud Run injects automatically)

Secrets (via Secret Manager):
  - DATABASE_URL (PostgreSQL connection string with Unix socket)
  - DATABASE_POOL_MIN (2)
  - DATABASE_POOL_MAX (10)
  - NODE_ENV (production)
  - SWAGGER_ENABLED (false)
```

**Deployment Command:**

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

**Health Check:**

```bash
curl https://chamuco-api-393715267650.us-central1.run.app/health
# Returns: {"status":"ok","info":{},"error":{},"details":{}}
```

**Configuration Rationale:**

- **512Mi memory:** Sufficient for NestJS with small connection pool; can scale up if >80% utilization
- **1 vCPU:** Balanced for CPU-light API workloads
- **Min 0 instances:** Cost optimization for MVP; consider min-instances=1 for production to eliminate cold starts
- **Max 10 instances:** Protects against runaway costs while allowing scale for traffic bursts
- **80 concurrency:** NestJS handles concurrent requests well; leaves headroom for long-running queries
- **VPC egress private-ranges-only:** Database on VPC, external APIs via internet (Firebase, OAuth)
- **Gen2 execution:** Faster cold starts (<5s), better performance, required for VPC connector

### Web Service (`chamuco-web`)

**Service URL:** `https://chamuco-web-393715267650.us-central1.run.app`
**Current Revision:** `chamuco-web-00001-4km` (or latest)

**Configuration:**

```yaml
Image: us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/web:latest
Region: us-central1
Platform: managed
Service Account: default Compute Engine service account

Resources:
  Memory: 1Gi
  CPU: 1 vCPU
  Min Instances: 0 (scales to zero)
  Max Instances: 5
  Concurrency: 100 requests/instance
  Timeout: 60s
  Port: 3000

Access:
  Authentication: allow-unauthenticated (public web app)
  Ingress: all
  HTTP/2: disabled

Environment:
  Execution Environment: gen2
  PORT: 3000 (Cloud Run injects automatically)
  NODE_ENV: production
  NEXT_PUBLIC_API_URL: https://chamuco-api-393715267650.us-central1.run.app
```

**Deployment Command:**

```bash
gcloud run deploy chamuco-web \
  --image=us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/web:latest \
  --region=us-central1 \
  --platform=managed \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=https://chamuco-api-393715267650.us-central1.run.app" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --concurrency=100 \
  --timeout=60s \
  --port=3000 \
  --allow-unauthenticated \
  --ingress=all \
  --no-use-http2 \
  --execution-environment=gen2 \
  --project=chamuco-app-mn
```

**Health Check:**

```bash
curl -I https://chamuco-web-393715267650.us-central1.run.app
# Returns: HTTP/2 200
```

**Configuration Rationale:**

- **1Gi memory:** Next.js SSR requires more memory than the API; 512Mi led to OOM crashes
- **Max 5 instances:** Web traffic typically lower than API traffic (API serves both web and mobile)
- **100 concurrency:** Next.js handles high concurrency well with App Router
- **No VPC connector:** Web service doesn't need direct database access (calls API instead)
- **No service account specified:** Uses default Compute Engine SA; sufficient for public web app

### Service Account Permissions

**chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com:**

- `roles/cloudsql.client` — Connect to Cloud SQL via Unix socket
- `roles/logging.logWriter` — Write logs to Cloud Logging
- `roles/monitoring.metricWriter` — Write metrics to Cloud Monitoring
- `roles/cloudtrace.agent` — Send trace data to Cloud Trace
- `roles/secretmanager.secretAccessor` — Read secrets (DATABASE_URL, etc.)

**Web service (default Compute Engine SA):**

- `roles/logging.logWriter` — Write logs
- `roles/monitoring.metricWriter` — Write metrics

### Monitoring and Logs

**View logs:**

```bash
gcloud run services logs read chamuco-api --region=us-central1 --limit=100
gcloud run services logs read chamuco-web --region=us-central1 --limit=100
```

**View service details:**

```bash
gcloud run services describe chamuco-api --region=us-central1
gcloud run services describe chamuco-web --region=us-central1
```

**List revisions:**

```bash
gcloud run revisions list --service=chamuco-api --region=us-central1
gcloud run revisions list --service=chamuco-web --region=us-central1
```

### Performance Metrics (MVP Baseline)

**API Service:**

- Cold start: ~3-5s (gen2)
- p95 response time: <500ms (health endpoint)
- Memory utilization: ~150-200Mi at idle
- CPU utilization: <5% at idle

**Web Service:**

- Cold start: ~5-8s (Next.js SSR startup)
- TTFB p95: <2s (homepage SSR)
- Memory utilization: ~400-600Mi at idle
- CPU utilization: <10% at idle

### Cost Breakdown (Actual)

**Cloud Run (per month):**

- API: $5-10 (light MVP traffic, scales to zero)
- Web: $8-15 (Next.js higher memory, occasional SSR requests)

**Total Cloud Run: $13-25/month**

Combined with Cloud SQL (~$10/month) and VPC connector (~$12/month), total MVP infrastructure: ~$35-47/month.

---

## CI/CD

**GitHub Actions** is the chosen CI/CD platform. It provides maximum flexibility, a large ecosystem of reusable actions, and integrates directly with the GitHub repository without requiring additional GCP configuration.

### Pipeline Design Principles

- There are **two independent pipelines**: one for the backend (`api`) and one for the frontend (`web`). Each can run, fail, and deploy independently.
- Both pipelines are **triggered automatically on every push to `main`**.
- Pull requests trigger the same pipelines in **dry-run mode** (all steps up to but not including deployment).
- Pipelines are defined as workflow files in `.github/workflows/`.

---

### Backend Pipeline (`.github/workflows/api.yml`)

Triggered by: push or PR affecting `apps/api/**` or `packages/**`.

```
1. Install dependencies        pnpm install
2. Lint                        pnpm --filter api lint
3. Type check                  pnpm --filter api tsc --noEmit
4. Unit & integration tests    pnpm --filter api test              (Jest + @swc/jest)
5. Build                       pnpm --filter api build
6. Build Docker image          docker build -t gcr.io/$PROJECT/api:$SHA .
7. Push image                  Push to Artifact Registry          [main only]
8. Run DB migrations           drizzle-kit migrate (via Cloud SQL) [main only]
9. Deploy to Cloud Run         gcloud run deploy api ...           [main only]
```

**Step 4 — Tests** use Jest with `@swc/jest` as the transpiler. `@nestjs/testing` module is used to spin up isolated application contexts for integration tests without a real HTTP server.

**Step 8 — DB migrations** runs immediately before the new container is deployed. The migration applies all pending `.sql` files in order against the production (or staging) Cloud SQL instance. If the migration fails, the deployment step is skipped — the running version is never replaced with a version whose schema is not yet applied.

The migration step connects to Cloud SQL using the **Cloud SQL Auth Proxy** with a service account that has the minimum required permissions (`Cloud SQL Client` role).

---

### Frontend Pipeline (`.github/workflows/web.yml`)

Triggered by: push or PR affecting `apps/web/**` or `packages/**`.

```
1. Install dependencies        pnpm install
2. Lint                        pnpm --filter web lint
3. Type check                  pnpm --filter web tsc --noEmit
4. i18n check                  eslint-plugin-i18next (no hardcoded strings)
5. Unit & component tests      pnpm --filter web test              (Vitest + RTL)
6. Build                       pnpm --filter web build
7. E2E tests                   pnpm --filter web test:e2e          (Playwright) [main only]
8. Build Docker image          docker build -t gcr.io/$PROJECT/web:$SHA .       [main only]
9. Push image                  Push to Artifact Registry                        [main only]
10. Deploy to Cloud Run        gcloud run deploy web ...                        [main only]
```

**Step 4 (i18n check)** is a CI gate — the pipeline fails if any hardcoded user-facing string is detected, enforcing the no-hardcoded-text rule at the pipeline level in addition to the local lint.

**Step 5 (unit & component tests)** use Vitest with React Testing Library. Vitest's ESM-native runtime aligns with Next.js App Router's module format without additional configuration.

**Step 7 (E2E tests)** use Playwright and run after a successful build against the built Next.js output. E2E tests are gated to `main` only to avoid the added CI time on every pull request; critical flows can be promoted to run on PRs as the suite matures.

---

### Shared Considerations

- **Secrets:** GCP credentials (service account JSON) and other secrets are stored as **GitHub Actions Secrets**. They are never logged or exposed in workflow output.
- **Path filtering:** Each workflow uses `paths:` filters so that a change only to `apps/web/**` does not trigger the backend pipeline, and vice versa. Changes to `packages/**` (shared types, utils) trigger both.
- **Environments:** GitHub Environments (`staging`, `production`) are used to gate deployments with required reviewers if needed in the future.
- **Monorepo awareness:** `pnpm --filter <package>` ensures only the affected workspace package is built and tested in each pipeline.

---

## Secrets Management

All secrets (database credentials, API keys, JWT signing keys) are stored in **GCP Secret Manager**. They are injected into Cloud Run services as environment variables at deploy time — never hardcoded in source code or committed to Git.

`.env` files are used only for local development and are excluded from the repository via `.gitignore`.

---

## Cost Considerations

GCP services used are selected with cost efficiency in mind for an early-stage product:

**Cloud Run (API + Web):**

- Scales to zero when idle — no cost when there's no traffic
- Pricing: $0.00002400/vCPU-second, $0.00000250/GiB-second
- Estimated MVP: ~$5-10/month (light traffic)
- Estimated Production: ~$50-100/month (moderate traffic)

**Cloud SQL (PostgreSQL):**

- MVP: `db-f1-micro` ~$10/month (0.6 GB RAM, shared CPU, 10 GB storage)
- Production: `db-custom-1-3840` ~$62/month (1 vCPU, 3.75 GB RAM, 50 GB storage)
- Backups: ~$0.80-4/month (7-day retention)
- High availability (regional): 2x instance cost

**VPC Serverless Connector:**

- 2 min instances (e2-micro): ~$12/month
- Additional instances: ~$0.01/minute (on-demand)

**Cloud Storage:**

- $0.020/GB/month (standard storage)
- $0.12/GB download (first 1TB)
- Estimated MVP: ~$1-5/month

**Artifact Registry:**

- $0.10/GB/month storage
- Estimated: ~$1-2/month (Docker images)

**Total Estimated Monthly Cost:**

- **MVP:** ~$30-40/month
- **Production:** ~$130-180/month

**Cost Optimization:**

- Start with `db-f1-micro`, upgrade when CPU/memory saturates
- Enable storage auto-increase with limits to prevent surprises
- Use 7-day backup retention (sufficient for most use cases)
- Point-in-time recovery only if sub-hour granularity needed
- Regional HA only for production (doubles Cloud SQL cost)

**Budget Alerts:**
Configure billing alerts at 50% and 90% of monthly budget via GCP Console or:

```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Chamuco Monthly Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```
