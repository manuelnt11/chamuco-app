# Secrets Management — GCP Secret Manager

This document describes how to manage sensitive configuration and credentials using Google Cloud Secret Manager.

## Table of Contents

- [Overview](#overview)
- [Current Secrets](#current-secrets)
- [Adding New Secrets](#adding-new-secrets)
- [Updating Secret Values](#updating-secret-values)
- [Granting Access](#granting-access)
- [Referencing Secrets in Cloud Run](#referencing-secrets-in-cloud-run)
- [Rotating Secrets](#rotating-secrets)
- [Best Practices](#best-practices)

---

## Overview

**Secret Manager** is GCP's secure storage solution for sensitive data like API keys, database passwords, and OAuth credentials. Secrets are:

- **Encrypted at rest and in transit**
- **Versioned** — can roll back to previous values
- **Access-controlled** — IAM policies determine who can read/write
- **Audited** — all access is logged

**Why not environment variables?**

- Environment variables are visible in Cloud Run console (security risk)
- Changing env vars requires redeployment
- Secret Manager allows zero-downtime updates

---

## Current Secrets

| Secret Name         | Purpose                                    | Used By     |
| ------------------- | ------------------------------------------ | ----------- |
| `DATABASE_URL`      | PostgreSQL connection string (unix socket) | chamuco-api |
| `DATABASE_POOL_MIN` | Minimum database connections (2)           | chamuco-api |
| `DATABASE_POOL_MAX` | Maximum database connections (10)          | chamuco-api |
| `NODE_ENV`          | Node.js environment (production)           | chamuco-api |
| `SWAGGER_ENABLED`   | Enable Swagger UI (false in production)    | chamuco-api |

**Placeholder secrets (not yet populated):**

- `FIREBASE_CREDENTIALS` — Firebase Admin SDK service account key
- `FACEBOOK_CLIENT_ID` — OAuth client ID
- `FACEBOOK_CLIENT_SECRET` — OAuth client secret

---

## Adding New Secrets

### 1. Create the Secret

```bash
gcloud secrets create SECRET_NAME \
  --replication-policy="automatic" \
  --project=chamuco-app-mn
```

**Replication policy:**

- `automatic` — Replicated across all regions (recommended for high availability)
- `user-managed` — Specify regions manually (for compliance)

### 2. Add Initial Value

**From string:**

```bash
echo -n "secret-value-here" | \
  gcloud secrets versions add SECRET_NAME --data-file=- --project=chamuco-app-mn
```

**From file:**

```bash
gcloud secrets versions add SECRET_NAME \
  --data-file=/path/to/secret.json \
  --project=chamuco-app-mn
```

**IMPORTANT:** Use `echo -n` (no newline) for string secrets. Extra whitespace will be included in the secret value.

### 3. Grant Service Account Access

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:chamuco-api-sa@chamuco-app-mn.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=chamuco-app-mn
```

### 4. Reference in Cloud Run

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --update-secrets="ENV_VAR_NAME=SECRET_NAME:latest"
```

---

## Updating Secret Values

Secrets are **immutable** — updating creates a new version. Old versions remain accessible.

### Add New Version

```bash
echo -n "new-secret-value" | \
  gcloud secrets versions add SECRET_NAME --data-file=- --project=chamuco-app-mn
```

**What happens:**

- New version is created (e.g., version 2)
- Cloud Run services using `:latest` will pick it up on **next deployment**
- Existing instances continue using cached version until redeployed

### Force Immediate Update

Redeploy the Cloud Run service to pick up the new secret:

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --project=chamuco-app-mn
```

This triggers a new revision with updated secret values. Zero downtime.

---

## Granting Access

### Service Account Access (Production)

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=chamuco-app-mn
```

**Roles:**

- `roles/secretmanager.secretAccessor` — Read secret values (for Cloud Run)
- `roles/secretmanager.admin` — Full control (create, update, delete)

### User Access (Developers)

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="user:developer@example.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=chamuco-app-mn
```

**Best practice:** Limit developer access. Use least privilege.

### View Current IAM Policy

```bash
gcloud secrets get-iam-policy SECRET_NAME --project=chamuco-app-mn
```

---

## Referencing Secrets in Cloud Run

### Mount as Environment Variable

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --set-secrets="ENV_VAR_NAME=SECRET_NAME:latest"
```

**Version pinning:**

- `:latest` — Always use newest version (recommended)
- `:1`, `:2`, etc. — Pin to specific version (for rollback)

### Multiple Secrets

```bash
gcloud run services update chamuco-api \
  --region=us-central1 \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,NODE_ENV=NODE_ENV:latest,API_KEY=API_KEY:latest"
```

### In Dockerfile (Not Recommended)

**DO NOT** hardcode secrets in Dockerfile or commit them to Git. Always use Secret Manager.

---

## Rotating Secrets

Rotating secrets (e.g., API keys, passwords) requires a multi-step process to avoid downtime.

### Zero-Downtime Rotation

1. **Add new secret version:**

   ```bash
   echo -n "new-password" | \
     gcloud secrets versions add DATABASE_PASSWORD --data-file=-
   ```

2. **Deploy with new secret:**

   ```bash
   gcloud run services update chamuco-api --region=us-central1
   ```

3. **Verify deployment:**

   ```bash
   # Check logs for errors
   gcloud run logs tail chamuco-api --region=us-central1

   # Test API health
   curl https://chamuco-api-xxxxx-uc.a.run.app/health
   ```

4. **Update external systems** (if applicable):
   - Update database password
   - Rotate OAuth credentials in provider console

5. **Disable old secret version** (optional):
   ```bash
   gcloud secrets versions disable 1 --secret=DATABASE_PASSWORD
   ```

### Rollback

If new secret causes issues:

```bash
# Pin Cloud Run to old secret version
gcloud run services update chamuco-api \
  --region=us-central1 \
  --update-secrets="DATABASE_PASSWORD=DATABASE_PASSWORD:1"
```

---

## Best Practices

### Security

1. **Never log secrets** — Redact in error messages and logs

   ```typescript
   // ❌ Bad
   console.log(`Connecting with ${DATABASE_URL}`);

   // ✅ Good
   console.log('Connecting to database...');
   ```

2. **Use separate secrets per environment** — Don't reuse production secrets in staging

3. **Rotate regularly** — Change sensitive secrets quarterly or after team member departure

4. **Audit access** — Review IAM policies monthly

   ```bash
   gcloud secrets list --project=chamuco-app-mn --format="table(name)"

   for secret in $(gcloud secrets list --format="value(name)"); do
     echo "=== $secret ==="
     gcloud secrets get-iam-policy $secret
   done
   ```

5. **Enable audit logging** — Track who accessed which secret when

### Development

1. **Use .env files locally** — Never commit to Git (add to .gitignore)

2. **Provide .env.example** — Template without actual values

3. **Document secret format** — Help teammates know what values are expected

   ```bash
   # .env.example
   DATABASE_URL=postgresql://user@host:port/database
   API_KEY=your_api_key_here
   ```

4. **Use different values** — Local secrets should differ from production

### Operations

1. **Version naming convention:**
   - Use semantic versions or timestamps in secret descriptions
   - Tag with environment: `prod`, `staging`, `dev`

2. **Disaster recovery plan:**
   - Export critical secrets to encrypted backup
   - Store backup in separate secure location
   - Test restoration procedure

3. **Automate secret creation:**
   - Use Terraform or gcloud scripts
   - Version control the infrastructure code (not the secret values)

---

## Troubleshooting

### Secret not updating in Cloud Run

**Cause:** Cloud Run caches secrets until redeployment.

**Fix:**

```bash
gcloud run services update SERVICE_NAME --region=us-central1
```

### Permission denied accessing secret

**Cause:** Service account lacks `secretmanager.secretAccessor` role.

**Fix:**

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

### Secret contains extra whitespace

**Cause:** Used `echo` instead of `echo -n`.

**Fix:** Add new version with correct value:

```bash
echo -n "correct-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

---

## Reference

- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Secrets](https://cloud.google.com/run/docs/configuring/secrets)
- [IAM Roles for Secret Manager](https://cloud.google.com/secret-manager/docs/access-control)
