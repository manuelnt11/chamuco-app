# Local Development Environment

**Status:** Implemented
**Last Updated:** 2026-03-28

This guide covers the local development setup for Chamuco App, including the Docker-based PostgreSQL database and development workflow.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Management](#database-management)
4. [Development Workflow](#development-workflow)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Usage](#advanced-usage)

---

## Prerequisites

### Required Software

1. **Node.js 22+**

   ```bash
   # Check version
   node --version  # Should be >= 22.0.0
   ```

2. **pnpm 10+**

   ```bash
   # Install via npm
   npm install -g pnpm@latest

   # Or via Homebrew (macOS)
   brew install pnpm

   # Check version
   pnpm --version  # Should be >= 10.0.0
   ```

3. **Docker Desktop**
   - **macOS:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **Linux:** [Install Docker Engine](https://docs.docker.com/engine/install/)
   - **Windows:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 required)

   ```bash
   # Verify installation
   docker --version
   docker compose version
   ```

4. **Git**
   ```bash
   # Should already be installed
   git --version
   ```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/manuelnt11/chamuco-app.git
cd chamuco-app
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This installs dependencies for:

- Root workspace
- `apps/api` (NestJS backend)
- `apps/web` (Next.js frontend)
- `packages/shared-types`
- `packages/shared-utils`

### 3. Start Database

```bash
# Start PostgreSQL in Docker
pnpm db:start
```

**What happens:**

1. ✅ Downloads `postgres:16-alpine` image (first time only)
2. ✅ Creates named volume `chamuco-postgres-data`
3. ✅ Starts container `chamuco-postgres`
4. ✅ Waits for PostgreSQL to be ready (health check)
5. ✅ Runs Drizzle migrations automatically
6. ✅ Prints connection details

**Output:**

```
🚀 Starting PostgreSQL database...
ℹ️  Container doesn't exist. Creating...
✅ Container created and started
✅ PostgreSQL is ready
ℹ️  Running database migrations...
✅ migrations applied successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database is ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Connection details:
   Host:     localhost
   Port:     5432
   Database: chamuco_dev
   User:     postgres
   Password: postgres

🔧 Useful commands:
   pnpm db:stop    Stop the database
   pnpm db:psql    Open psql shell
   pnpm db:logs    View container logs
   pnpm db:reset   Reset database (WARNING: destroys all data)
```

### 4. Verify Database Connection

```bash
# Open PostgreSQL shell
pnpm db:psql

# Inside psql:
\dt                          # List tables
\d drizzle.__drizzle_migrations  # Show migrations table
SELECT * FROM drizzle.__drizzle_migrations;  # View applied migrations
\q                           # Quit
```

### 5. Start Development Servers

```bash
# Start all apps (API + Web) in development mode
pnpm dev
```

This runs:

- **API:** `http://localhost:3000` (NestJS backend)
  - Swagger docs: `http://localhost:3000/api/docs`
  - Health check: `http://localhost:3000/health`
- **Web:** `http://localhost:3001` (Next.js frontend)

---

## Database Management

### Available Commands

```bash
# Start database (or restart if stopped)
pnpm db:start

# Stop database (data preserved)
pnpm db:stop

# Reset database (WARNING: destroys all data)
pnpm db:reset

# View container logs
pnpm db:logs

# Open PostgreSQL shell
pnpm db:psql
```

### Database Lifecycle

**First Run:**

```bash
pnpm db:start
# → Downloads image
# → Creates container and volume
# → Runs migrations
```

**Subsequent Runs:**

```bash
# After reboot or `pnpm db:stop`:
pnpm db:start
# → Starts existing container
# → Data is preserved
# → Runs new migrations only
```

**Stop (preserves data):**

```bash
pnpm db:stop
# → Stops container
# → Volume remains intact
# → Data persists
```

**Reset (destroys data):**

```bash
pnpm db:reset
# Prompts: Type 'RESET' to confirm
# → Stops container
# → Removes container
# → Removes volume (data lost)
# → Creates fresh container
# → Runs migrations
```

---

## Development Workflow

### Typical Day

```bash
# 1. Start database (if not running)
pnpm db:start

# 2. Start development servers
pnpm dev

# 3. Make code changes...

# 4. Run tests
pnpm test

# 5. Stop when done
pnpm db:stop
```

### Working with Migrations

**Create New Migration:**

1. Modify schema files in `apps/api/src/database/schema/`

2. Generate migration:

   ```bash
   pnpm --filter api db:generate
   ```

   Creates new `.sql` file in `apps/api/src/database/migrations/`

3. Review the generated SQL

4. Apply migration:

   ```bash
   pnpm db:start  # Migrations run automatically
   # Or manually:
   pnpm --filter api db:migrate
   ```

5. Commit both schema and migration files:
   ```bash
   git add apps/api/src/database/schema/
   git add apps/api/src/database/migrations/
   git commit -m "feat: add users table schema"
   ```

### Inspecting the Database

**Option 1: psql (Terminal)**

```bash
pnpm db:psql

# Inside psql:
\l                    # List databases
\c chamuco_dev        # Connect to database
\dt                   # List tables
\d table_name         # Describe table
SELECT * FROM table_name LIMIT 10;
\q                    # Quit
```

**Option 2: Drizzle Studio (GUI)**

```bash
pnpm --filter api db:studio
```

Opens browser at `https://local.drizzle.studio` with visual database explorer.

**Option 3: External Tool**

Use any PostgreSQL client:

- **TablePlus** (macOS/Windows) — Recommended
- **pgAdmin** (Cross-platform)
- **DBeaver** (Cross-platform)
- **DataGrip** (JetBrains)

Connection details:

- Host: `localhost`
- Port: `5432`
- Database: `chamuco_dev`
- User: `postgres`
- Password: `postgres`

---

## Troubleshooting

### Issue: Container Won't Start

**Error:**

```
Error response from daemon: port is already allocated
```

**Cause:** Port 5432 already in use (another PostgreSQL instance running)

**Fix:**

```bash
# Option 1: Stop system PostgreSQL
brew services stop postgresql@16  # macOS
sudo systemctl stop postgresql    # Linux

# Option 2: Change Docker port in docker-compose.yml
ports:
  - "5433:5432"  # Change local port to 5433

# Then update DATABASE_URL in apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/chamuco_dev
```

### Issue: Migrations Fail

**Error:**

```
drizzle-kit migrate failed
```

**Cause:** Schema syntax error or conflicting migration

**Fix:**

```bash
# 1. Check migration SQL files
cat apps/api/src/database/migrations/<latest>.sql

# 2. If broken, delete the migration
rm apps/api/src/database/migrations/<latest>.sql
rm apps/api/src/database/migrations/meta/<latest>.json

# 3. Regenerate
pnpm --filter api db:generate

# 4. Reset database if needed
pnpm db:reset
```

### Issue: "Database Already Exists" Error

**Cause:** Container was removed but volume still exists

**Fix:**

```bash
# Remove the volume manually
docker volume rm chamuco-postgres-data

# Start fresh
pnpm db:start
```

### Issue: Can't Connect to Database from API

**Error in API logs:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** Database not running or wrong DATABASE_URL

**Fix:**

```bash
# 1. Verify container is running
docker ps | grep chamuco-postgres

# 2. If not running:
pnpm db:start

# 3. Verify DATABASE_URL in apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chamuco_dev
```

### Issue: Lost Data After Reset

**Cause:** `pnpm db:reset` was run (this is by design)

**Fix:**
Unfortunately, data cannot be recovered after `db:reset`.

**Prevention:**

- Use `pnpm db:stop` to preserve data
- `db:reset` requires typing `RESET` to confirm (hard to do accidentally)
- For important test data, create a seed script

---

## Advanced Usage

### Seed Database with Test Data

**Create seed script:**

```typescript
// apps/api/src/database/seed.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  // Insert test data
  console.log('Seeding database...');

  // Example:
  // await db.insert(users).values([...]);

  console.log('Seed complete!');
  await client.end();
}

seed().catch(console.error);
```

**Add script to package.json:**

```json
{
  "scripts": {
    "db:seed": "tsx src/database/seed.ts"
  }
}
```

**Run:**

```bash
pnpm --filter api db:seed
```

### Connect from Host Machine (Outside Docker)

Database is already accessible on `localhost:5432` (no extra setup needed).

### Access Logs

```bash
# Tail logs (live)
pnpm db:logs

# View last 50 lines
docker logs chamuco-postgres --tail 50

# Follow logs with timestamps
docker logs chamuco-postgres -f --timestamps
```

### Backup Local Database

```bash
# Create backup
docker exec chamuco-postgres pg_dump -U postgres chamuco_dev > backup.sql

# Restore backup
pnpm db:reset  # Start with fresh database
docker exec -i chamuco-postgres psql -U postgres -d chamuco_dev < backup.sql
```

### Run Multiple Database Instances

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    container_name: chamuco-postgres
    ports:
      - '5432:5432'
    # ...

  postgres-staging:
    image: postgres:16-alpine
    container_name: chamuco-postgres-staging
    environment:
      POSTGRES_DB: chamuco_staging
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5433:5432'
    volumes:
      - chamuco-postgres-staging-data:/var/lib/postgresql/data

volumes:
  chamuco-postgres-data:
    name: chamuco-postgres-data
  chamuco-postgres-staging-data:
    name: chamuco-postgres-staging-data
```

Then:

```bash
docker compose up -d postgres-staging
```

---

## Environment Variables Reference

### Required Variables (`apps/api/.env`)

```bash
# Environment
NODE_ENV=development

# Server
PORT=3000

# API Documentation
SWAGGER_ENABLED=true

# Database (Local Development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chamuco_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=debug  # debug, info, warn, error

# CORS (for local frontend)
CORS_ORIGIN=http://localhost:3001
```

---

## Next Steps

After setting up local development:

1. **Read Architecture Docs:**
   - [Backend Architecture](../architecture/backend-architecture.md)
   - [Database Design](../architecture/database-design.md)
   - [Monorepo Structure](../architecture/monorepo-structure.md)

2. **Explore Feature Specs:**
   - [Users](../features/users.md)
   - [Trips](../features/trips.md)
   - [Community (Groups & Messaging)](../features/community.md)

3. **Set Up Production (When Ready):**
   - [Cloud SQL Setup Guide](./cloud-sql-setup.md)
   - [CI/CD Pipeline](./cloud.md#cicd)

4. **Learn Development Conventions:**
   - [CLAUDE.md](../../CLAUDE.md) — Project rules for AI assistants
   - Pre-commit hooks enforce formatting, linting, and 90% test coverage

---

## Quick Reference

```bash
# Database
pnpm db:start          # Start PostgreSQL container
pnpm db:stop           # Stop container (data preserved)
pnpm db:reset          # Nuke database (requires confirmation)
pnpm db:logs           # View logs
pnpm db:psql           # Open psql shell

# Development
pnpm dev               # Start API + Web servers
pnpm build             # Build all packages
pnpm test              # Run tests
pnpm lint              # Lint all packages
pnpm format            # Format code with Prettier

# Drizzle ORM
pnpm --filter api db:generate   # Generate migration from schema
pnpm --filter api db:migrate    # Apply pending migrations
pnpm --filter api db:studio     # Open Drizzle Studio (GUI)

# Workspace
pnpm --filter api <command>     # Run command in API package
pnpm --filter web <command>     # Run command in Web package
```

---

## Related Documentation

- [Cloud SQL Setup Guide](./cloud-sql-setup.md) — Production database provisioning
- [Cloud & Deployment](./cloud.md) — Full GCP infrastructure overview
- [Backup & Restore Workflow](./backup-restore.md) — Production-to-local sync (Phase 3)
