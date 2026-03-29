# Deployment Guide — Cloud Run

This document describes how to deploy the Chamuco App to Google Cloud Run, both manually and via CI/CD automation.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [CI/CD Deployment (Recommended)](#cicd-deployment-recommended)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Rolling Back](#rolling-back)
- [Viewing Logs](#viewing-logs)
- [Monitoring and Metrics](#monitoring-and-metrics)
- [Scaling Configuration](#scaling-configuration)

---

## Overview

Chamuco App uses a **serverless deployment** model on Google Cloud Run. Both the NestJS API and Next.js web frontend are deployed as independent containerized services that auto-scale based on traffic.

**Deployment Architecture:**

```
[GitHub] → [GitHub Actions] → [Artifact Registry] → [Cloud Run]
                                      ↓
                            [Database Migrations]
```

**Key Components:**

- **Artifact Registry:** Stores Docker images (`us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images`)
- **Cloud Run Services:**
  - `chamuco-api` — NestJS backend (us-central1)
  - `chamuco-web` — Next.js frontend (us-central1)
- **Secret Manager:** Stores environment variables securely
- **Cloud SQL:** PostgreSQL database (private IP, VPC connector)

---

## Prerequisites

Before deploying, ensure you have:

1. **gcloud CLI installed and authenticated:**

   ```bash
   gcloud auth login
   gcloud config set project chamuco-app-mn
   ```

2. **Docker installed** (for manual deployment)

3. **Permissions:**
   - `roles/run.developer` — Deploy to Cloud Run
   - `roles/artifactregistry.writer` — Push Docker images
   - `roles/iam.serviceAccountUser` — Act as service accounts
   - `roles/cloudsql.client` — Run migrations via Cloud SQL Proxy

---

## CI/CD Deployment (Recommended)

The project uses GitHub Actions for automated deployment on every push to `main`.

### How It Works

**Two independent pipelines:**

1. **API Pipeline** (`.github/workflows/api.yml`):
   - Triggered by changes to `apps/api/**` or `packages/**`
   - Steps: Lint → Type check → Test → Build → Docker build → Push → **Migrate DB** → Deploy → Verify

2. **Web Pipeline** (`.github/workflows/web.yml`):
   - Triggered by changes to `apps/web/**` or `packages/**`
   - Steps: Lint → Type check → Test → Build → E2E tests → Docker build → Push → Deploy → Verify

**Dry-run mode:**

- Pull requests run all steps **except** deployment
- Only `main` branch pushes trigger actual deployment

### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret Name         | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `GCP_PROJECT_ID`    | `chamuco-app-mn`                                                     |
| `GCP_SA_KEY`        | JSON key for `github-actions@chamuco-app-mn.iam.gserviceaccount.com` |
| `GCP_REGION`        | `us-central1`                                                        |
| `ARTIFACT_REGISTRY` | `us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images`           |

**To create the service account key (if not already done):**

```bash
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@chamuco-app-mn.iam.gserviceaccount.com \
  --project=chamuco-app-mn

# Copy the contents and paste into GitHub Secrets as GCP_SA_KEY
cat github-actions-key.json | pbcopy
```

### Triggering a Deployment

Simply push to `main`:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Monitor deployment in **GitHub Actions** tab.

---

## Manual Deployment

For testing or emergency deployments, you can deploy manually.

### 1. Build and Push Docker Images

**API:**

```bash
# Build
docker build -f apps/api/Dockerfile -t us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:manual .

# Push
docker push us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:manual
```

**Web:**

```bash
# Build
docker build -f apps/web/Dockerfile -t us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/web:manual .

# Push
docker push us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/web:manual
```

### 2. Run Database Migrations (API Only)

**Connect via Cloud SQL Proxy:**

```bash
# Start proxy (in a separate terminal)
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433

# Run migrations (in another terminal)
DATABASE_URL=postgresql://manuelnt11@gmail.com@localhost:5433/chamuco_prod \
  pnpm --filter api db:migrate
```

### 3. Deploy to Cloud Run

**API:**

```bash
gcloud run deploy chamuco-api \
  --image=us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/api:manual \
  --region=us-central1 \
  --project=chamuco-app-mn
```

**Web:**

```bash
# Get API URL first
API_URL=$(gcloud run services describe chamuco-api \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=chamuco-app-mn)

gcloud run deploy chamuco-web \
  --image=us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images/web:manual \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=${API_URL}" \
  --project=chamuco-app-mn
```

---

## Environment Variables

Environment variables are managed via **Secret Manager** (API) or set directly (Web).

### API Service (from Secret Manager)

Configured in Cloud Run service:

- `DATABASE_URL` — PostgreSQL connection string (unix socket)
- `DATABASE_POOL_MIN` — Minimum connections (2)
- `DATABASE_POOL_MAX` — Maximum connections (10)
- `NODE_ENV` — production
- `SWAGGER_ENABLED` — false

**To update a secret:**

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

Cloud Run automatically picks up the latest version on next deployment.

### Web Service (environment variables)

Set directly in deployment command:

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=<API_SERVICE_URL>`

**To update:**

```bash
gcloud run services update chamuco-web \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://new-url.run.app"
```

---

## Rolling Back

Cloud Run keeps **previous revisions**. To roll back:

### 1. List Revisions

```bash
gcloud run revisions list \
  --service=chamuco-api \
  --region=us-central1 \
  --format="table(metadata.name,status.conditions[0].status,metadata.creationTimestamp)"
```

### 2. Roll Back to Specific Revision

```bash
gcloud run services update-traffic chamuco-api \
  --region=us-central1 \
  --to-revisions=chamuco-api-00042-abc=100
```

Instant rollback with zero downtime.

---

## Viewing Logs

### Cloud Logging (Recommended)

```bash
# API logs
gcloud run logs read chamuco-api \
  --region=us-central1 \
  --limit=100

# Web logs
gcloud run logs read chamuco-web \
  --region=us-central1 \
  --limit=100

# Tail logs (live)
gcloud run logs tail chamuco-api --region=us-central1

# Filter by severity
gcloud run logs read chamuco-api --region=us-central1 --log-filter="severity=ERROR"
```

### Cloud Console

Navigate to:

- [Cloud Run Services](https://console.cloud.google.com/run?project=chamuco-app-mn)
- Click service → **Logs** tab

---

## Monitoring and Metrics

### Cloud Run Metrics

View in Cloud Console:

- Request count
- Request latency (p50, p95, p99)
- Instance count
- Container CPU/memory utilization
- Cold start latency

### Custom Dashboards

1. Go to **Cloud Monitoring → Dashboards**
2. Create custom dashboard with:
   - Request latency
   - Error rate
   - Instance scaling
   - Database connection pool usage

### Alerts

Set up alerts for:

- Error rate >5%
- p95 latency >2s
- Instance count reaching max
- Memory utilization >80%

---

## Scaling Configuration

Current configuration:

| Service     | Min Instances | Max Instances | Concurrency | Memory | CPU |
| ----------- | ------------- | ------------- | ----------- | ------ | --- |
| chamuco-api | 0             | 10            | 80          | 512Mi  | 1   |
| chamuco-web | 0             | 5             | 100         | 1Gi    | 1   |

### Adjusting Scaling

**Increase max instances (handle more traffic):**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --max-instances=20
```

**Set min instances (reduce cold starts):**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --min-instances=1
```

**Cost impact:** `min-instances=1` costs ~$7-10/month per service even with zero traffic.

**Adjust memory/CPU:**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2
```

**Monitor first:** Check Cloud Run metrics before scaling. Most apps don't need adjustments from defaults.

---

## Troubleshooting

See [troubleshooting-cloud-run.md](./troubleshooting-cloud-run.md) for common deployment issues and solutions.

---

## Next Steps

- **Set up monitoring:** Create custom dashboards and alerts
- **Enable Cloud CDN:** For static assets (post-MVP)
- **Custom domains:** Map `api.chamucotravel.com` and `chamucotravel.com`
- **Cloud Armor:** Add DDoS protection and WAF rules (production)
