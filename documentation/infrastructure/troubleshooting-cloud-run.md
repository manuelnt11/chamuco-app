# Troubleshooting Cloud Run Deployments

Common deployment issues, their causes, and solutions for Cloud Run services.

## Table of Contents

- [Deployment Failures](#deployment-failures)
- [Cold Start Issues](#cold-start-issues)
- [Database Connection Problems](#database-connection-problems)
- [Memory and CPU Issues](#memory-and-cpu-issues)
- [Health Check Failures](#health-check-failures)
- [Migration Failures](#migration-failures)
- [Secret Access Issues](#secret-access-issues)
- [Performance Degradation](#performance-degradation)

---

## Deployment Failures

### Image Pull Errors

**Symptom:**

```
ERROR: (gcloud.run.deploy) Image 'us-central1-docker.pkg.dev/...' could not be pulled
```

**Causes:**

1. Image doesn't exist in Artifact Registry
2. Service account lacks `artifactregistry.reader` role
3. Typo in image name/tag

**Solution:**

```bash
# Verify image exists
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/chamuco-app-mn/chamuco-images \
  --include-tags

# Grant service account access
gcloud artifacts repositories add-iam-policy-binding chamuco-images \
  --location=us-central1 \
  --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

### Container Crashes on Startup

**Symptom:**

- Cloud Run shows "Revision failed"
- Logs show container exiting immediately

**Causes:**

1. Missing required environment variables
2. Port mismatch (app not listening on `$PORT`)
3. Startup command incorrect
4. Missing dependencies

**Solution:**

```bash
# Check logs for error message
gcloud run logs read SERVICE_NAME --region=us-central1 --limit=50

# Verify environment variables
gcloud run services describe SERVICE_NAME \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"

# Test Docker image locally
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e DATABASE_URL=postgresql://... \
  IMAGE_NAME
```

### Permission Denied Errors

**Symptom:**

```
ERROR: (gcloud.run.services.update) PERMISSION_DENIED: Permission denied on resource
```

**Cause:** User or service account lacks necessary IAM roles.

**Solution:**

```bash
# Check current IAM policy
gcloud projects get-iam-policy chamuco-app-mn

# Grant run.developer role
gcloud projects add-iam-policy-binding chamuco-app-mn \
  --member="serviceAccount:SERVICE_ACCOUNT" \
  --role="roles/run.developer"

# Grant serviceAccountUser role
gcloud projects add-iam-policy-binding chamuco-app-mn \
  --member="serviceAccount:SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser"
```

---

## Cold Start Issues

### Long Cold Start Times (>10s)

**Symptom:** First request after scale-to-zero takes 10-20+ seconds.

**Causes:**

1. Large Docker image size
2. Slow application initialization
3. Heavy dependencies loaded at startup

**Solutions:**

**1. Optimize Docker image:**

```dockerfile
# Use multi-stage builds
# Keep final image minimal
FROM node:20-alpine  # Alpine is smaller than full node image

# Remove dev dependencies
RUN pnpm install --prod --frozen-lockfile
```

**2. Set min-instances:**

```bash
# Keep 1 instance always warm (costs ~$7/month)
gcloud run services update chamuco-api \
  --region=us-central1 \
  --min-instances=1
```

**3. Use startup CPU boost** (Cloud Run gen2):

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --cpu-boost  # Already enabled by default in gen2
```

**4. Lazy-load heavy modules:**

```typescript
// ❌ Bad: Load at startup
import { HeavyModule } from 'heavy-module';

// ✅ Good: Load on first use
let heavyModule: any;
async function getHeavyModule() {
  if (!heavyModule) {
    heavyModule = await import('heavy-module');
  }
  return heavyModule;
}
```

**5. Use Cloud Scheduler for keep-alive:**

```bash
# Ping health endpoint every 5 minutes
gcloud scheduler jobs create http keep-alive-api \
  --schedule="*/5 * * * *" \
  --uri="https://chamuco-api-xxxxx-uc.a.run.app/health" \
  --location=us-central1
```

---

## Database Connection Problems

### Cloud SQL Connection Timeout

**Symptom:**

```
Error: connect ETIMEDOUT
Error: Cloud SQL socket not found
```

**Causes:**

1. VPC connector not configured
2. Cloud SQL instance connection name incorrect
3. Service account lacks `cloudsql.client` role

**Solutions:**

**1. Verify VPC connector:**

```bash
gcloud run services describe chamuco-api \
  --region=us-central1 \
  --format="value(spec.template.spec.vpcAccess.connector)"

# Should output: projects/chamuco-app-mn/locations/us-central1/connectors/chamuco-vpc-connector
```

**2. Verify Cloud SQL instance configuration:**

```bash
gcloud run services describe chamuco-api \
  --region=us-central1 \
  --format="value(spec.template.metadata.annotations.\'run.googleapis.com/cloudsql-instances\')"

# Should output: chamuco-app-mn:us-central1:chamuco-postgres
```

**3. Grant cloudsql.client role:**

```bash
gcloud projects add-iam-policy-binding chamuco-app-mn \
  --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

**4. Verify DATABASE_URL format:**

```
# Unix socket (correct for Cloud Run)
postgresql://SERVICE_ACCOUNT@/DATABASE_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE

# ❌ Wrong (TCP connection won't work from Cloud Run)
postgresql://user:password@10.34.0.3:5432/database
```

### Connection Pool Exhaustion

**Symptom:**

```
Error: remaining connection slots are reserved
Error: sorry, too many clients already
```

**Cause:** Too many Cloud Run instances, each with large connection pools.

**Solution:**

**1. Reduce pool size per instance:**

```typescript
// drizzle.config.ts
{
  pool: {
    min: 2,  // Small pool per instance
    max: 10,
  }
}
```

**2. Limit max instances:**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --max-instances=10
```

**3. Upgrade Cloud SQL tier:**

```bash
# Check current connections
gcloud sql instances describe chamuco-postgres \
  --format="value(settings.tier)"

# Upgrade to higher tier with more max connections
gcloud sql instances patch chamuco-postgres \
  --tier=db-custom-1-3840
```

---

## Memory and CPU Issues

### Container Out of Memory (OOM)

**Symptom:**

- Cloud Run logs: `Memory limit exceeded`
- Service becomes unavailable
- Instances restart frequently

**Solution:**

**1. Check memory usage:**

```bash
# View Cloud Run metrics in console
# Look for memory utilization graph

# Check logs for OOM killer
gcloud run logs read chamuco-api --region=us-central1 | grep -i "out of memory"
```

**2. Increase memory limit:**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --memory=1Gi  # Increase from 512Mi
```

**3. Optimize application memory usage:**

```typescript
// Avoid memory leaks
// - Clear intervals/timers
// - Close database connections
// - Use streams for large data

// Example: Enable graceful shutdown
process.on('SIGTERM', async () => {
  await app.close();
  await db.end();
  process.exit(0);
});
```

### CPU Throttling

**Symptom:**

- Slow response times
- Requests timing out
- High CPU utilization in metrics

**Solution:**

**1. Increase CPU allocation:**

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --cpu=2  # Increase from 1
```

**2. Review code for CPU-intensive operations:**

```typescript
// ❌ Bad: Synchronous blocking operation
const result = heavyComputation(data);

// ✅ Good: Offload to worker or use async
const result = await workerPool.execute(heavyComputation, data);
```

---

## Health Check Failures

### 503 Service Unavailable

**Symptom:** Cloud Run doesn't route traffic to new revision.

**Cause:** Health check endpoint failing.

**Solution:**

**1. Test health endpoint:**

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe chamuco-api \
  --region=us-central1 \
  --format='value(status.url)')

# Test health endpoint
curl -v $SERVICE_URL/health
```

**2. Check health endpoint implementation:**

```typescript
// apps/api/src/health/health.controller.ts
@Get('health')
async check() {
  // Should return 200 OK quickly
  return { status: 'ok' };
}

// ❌ Don't check database in health endpoint (too slow)
// ✅ Keep it simple and fast
```

**3. Adjust startup period:**

```bash
# If app takes time to warm up
gcloud run services update chamuco-api \
  --region=us-central1 \
  --timeout=300  # Max timeout is 5 minutes
```

---

## Migration Failures

### Migrations Fail in CI/CD

**Symptom:** GitHub Actions workflow fails at migration step.

**Causes:**

1. Cloud SQL Proxy not started
2. Wrong DATABASE_URL format
3. Migration file syntax error
4. Service account lacks permissions

**Solution:**

**1. Verify proxy connection in CI/CD:**

```yaml
- name: Run database migrations
  run: |
    ./cloud_sql_proxy PROJECT:REGION:INSTANCE --port=5433 &
    sleep 5  # Wait for proxy to start
    DATABASE_URL=postgresql://github-actions@PROJECT.iam@localhost:5433/DB pnpm --filter api db:migrate
```

**2. Test migrations locally first:**

```bash
# Start proxy
cloud-sql-proxy chamuco-app-mn:us-central1:chamuco-postgres --port=5433

# Run migrations
DATABASE_URL=postgresql://USER@localhost:5433/chamuco_prod \
  pnpm --filter api db:migrate
```

**3. Check migration file:**

```bash
# View pending migrations
pnpm --filter api db:generate

# Check SQL syntax
cat apps/api/src/database/migrations/0001_migration.sql
```

---

## Secret Access Issues

### Cannot Access Secret from Cloud Run

**Symptom:**

```
Error: Secret not found
Error: Permission denied
```

**Solution:**

**1. Verify secret exists:**

```bash
gcloud secrets describe SECRET_NAME --project=chamuco-app-mn
```

**2. Check IAM policy:**

```bash
gcloud secrets get-iam-policy SECRET_NAME --project=chamuco-app-mn

# Grant access if missing
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**3. Verify secret is mounted:**

```bash
gcloud run services describe chamuco-api \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

---

## Performance Degradation

### Slow Response Times

**Checklist:**

1. **Check Cloud Run metrics** — CPU/memory utilization
2. **Check database** — Slow queries, connection pool exhaustion
3. **Check external APIs** — Third-party service latency
4. **Enable Cloud Trace** — Distributed tracing for request flow

**Quick fixes:**

```bash
# Increase concurrency
gcloud run services update chamuco-api --concurrency=100

# Increase max instances
gcloud run services update chamuco-api --max-instances=20

# Increase memory/CPU
gcloud run services update chamuco-api --memory=1Gi --cpu=2
```

---

## Getting Help

1. **View logs:**

   ```bash
   gcloud run logs tail SERVICE_NAME --region=us-central1
   ```

2. **Check service status:**

   ```bash
   gcloud run services describe SERVICE_NAME --region=us-central1
   ```

3. **Cloud Console:**
   - [Cloud Run Services](https://console.cloud.google.com/run?project=chamuco-app-mn)
   - [Logs Explorer](https://console.cloud.google.com/logs?project=chamuco-app-mn)
   - [Cloud Trace](https://console.cloud.google.com/traces?project=chamuco-app-mn)

4. **GCP Support:**
   - [Cloud Run Documentation](https://cloud.google.com/run/docs)
   - [Stack Overflow: google-cloud-run](https://stackoverflow.com/questions/tagged/google-cloud-run)
