# Infrastructure: Cloud & Deployment

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Cloud Provider

**Google Cloud Platform (GCP)** is the chosen cloud provider. This aligns with the Google SSO authentication strategy and the developer's existing GCP experience.

---

## Key GCP Services

| Service | Purpose |
|---|---|
| **Cloud Run** | Containerized backend (NestJS API). Serverless, auto-scaling, pay-per-use. |
| **Cloud SQL** | Managed PostgreSQL instance. Handles backups, patching, and failover. |
| **Cloud Storage** | File storage for user avatars, trip media, expense receipts, and booking confirmation PDFs. |
| **Cloud Build** | CI/CD pipelines for automated testing and deployment. |
| **Secret Manager** | Secure storage for environment variables, API keys, and credentials. |
| **Cloud CDN + Load Balancer** | HTTPS termination, CDN caching for the frontend, traffic routing. |
| **Artifact Registry** | Docker image registry for backend container images. |
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

To be defined in detail. Initial recommendations:

- **Branch strategy:** Pull requests trigger builds, tests, and staging deployments.
- **Production deployments:** Manual trigger or auto-deploy on merge to `main`.
- **Pipeline steps:** Install → Lint → Test → Build → Push image → Deploy to Cloud Run.

Tooling options: **GitHub Actions** (simpler, well-documented) or **Cloud Build** (native GCP, good for multi-project setups).

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
