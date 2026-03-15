# Infrastructure: Cloud & Deployment

**Status:** Design Phase
**Last Updated:** 2026-03-15

---

## Cloud Provider

**Google Cloud Platform (GCP)** is the chosen cloud provider. This aligns with the Google SSO authentication strategy and the developer's existing GCP experience.

---

## Key GCP Services

| Service | Purpose |
|---|---|
| **Cloud Run** | Containerized backend (NestJS API) and frontend (Next.js). Serverless, auto-scaling, pay-per-use. |
| **Cloud SQL** | Managed PostgreSQL instance. Source of truth for all relational data. Handles backups, patching, and failover. |
| **Cloud Storage** | File storage for user avatars, trip media, expense receipts, and booking confirmation PDFs. |
| **Firebase Authentication** | Google Sign-In and Passkeys. Managed token issuance, refresh, and revocation. |
| **Firestore** | Real-time message storage and delivery for DMs and channels. Synced from PostgreSQL membership data by the NestJS backend. |
| **Firebase Cloud Messaging (FCM)** | Push notifications for mobile and web when the app is in the background. |
| **GitHub Actions** | CI/CD pipelines for automated testing and deployment. |
| **Secret Manager** | Secure storage for environment variables, API keys, and service account credentials. |
| **Cloud CDN + Load Balancer** | HTTPS termination, CDN caching for the frontend, traffic routing. |
| **Artifact Registry** | Docker image registry for backend and frontend container images. |
| **Cloud Logging / Monitoring** | Structured log aggregation and uptime/performance monitoring. |

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

| Environment | Description |
|---|---|
| `development` | Local development. Runs against a local PostgreSQL instance or Cloud SQL proxy. |
| `staging` | A dedicated GCP project or namespace. Used for QA and pre-release testing. |
| `production` | The live environment. Separate GCP project recommended for billing and permission isolation. |

---

## Containerization

The NestJS API is packaged as a **Docker** container. The `Dockerfile` lives in `apps/api/`.

Key considerations:
- Multi-stage builds to minimize production image size.
- Non-root user in the container for security.
- Health check endpoint (`/health`) for Cloud Run readiness probes.

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
4. Unit tests                  pnpm --filter api test
5. Build                       pnpm --filter api build
6. Build Docker image          docker build -t gcr.io/$PROJECT/api:$SHA .
7. Push image                  Push to Artifact Registry          [main only]
8. Run DB migrations           drizzle-kit migrate (via Cloud SQL) [main only]
9. Deploy to Cloud Run         gcloud run deploy api ...           [main only]
```

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
5. Unit / component tests      pnpm --filter web test
6. Build                       pnpm --filter web build
7. Build Docker image          docker build -t gcr.io/$PROJECT/web:$SHA .  [main only]
8. Push image                  Push to Artifact Registry                   [main only]
9. Deploy to Cloud Run         gcloud run deploy web ...                   [main only]
```

Step 4 (i18n check) is a CI gate — the pipeline fails if any hardcoded user-facing string is detected, enforcing the no-hardcoded-text rule at the pipeline level in addition to the local lint.

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
- Cloud Run: Scales to zero when idle — no cost when there's no traffic.
- Cloud SQL: Smallest viable instance tier at launch; can be scaled up as needed.
- Cloud Storage: Pay-per-use; minimal cost at low usage.

A budget alert should be configured in GCP from day one.
