# Production Deployment Guide - RepoMentor

---

## 1. Overview & Architecture

RepoMentor runs as a decoupled three-tier microservice architecture:
1. **Frontend**: Next.js 14 App Router UI (`apps/web`, port 3000)
2. **API Gateway**: Fastify HTTP server (`apps/api`, port 4000)
3. **Background Worker**: BullMQ ingestion daemon (`apps/worker`)
4. **Data Layer**: PostgreSQL 16 with `pgvector` extension and Redis 7

---

## 2. Environment Variable Matrix

| Variable | Target Services | Description | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | All | Application environment | `production` |
| `DATABASE_URL` | API, Worker, DB | Postgres connection string with pgvector | `postgresql://repomentor:pass@postgres:5432/repomentor_prod` |
| `REDIS_URL` | API, Worker | BullMQ job queue Redis broker | `redis://:pass@redis:6379` |
| `ANTHROPIC_API_KEY` | API, Worker | Anthropic Claude API key for analysis & RAG | `sk-ant-api03-...` |
| `VOYAGE_API_KEY` | API, Worker | Voyage AI embedding API key | `pa-voyage-...` |
| `JWT_SECRET` | API | Minimum 32-character secret for token encryption | `strong-random-hex-string-here` |
| `NEXT_PUBLIC_API_URL` | Web | Public API gateway base URL | `https://api.repomentor.dev` |
| `PORT` | API, Web | Bound network port | `4000` / `3000` |

---

## 3. Production Deployment with Docker Compose

To deploy the full stack on a Linux VM (e.g., Ubuntu 22.04 LTS on AWS EC2, DigitalOcean, or Hetzner):

```bash
# 1. Clone repository
git clone https://github.com/organization/repomentor.git /opt/repomentor
cd /opt/repomentor

# 2. Configure production secrets
cp .env.example .env
nano .env

# 3. Apply database migrations
docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @repomentor/db db:migrate

# 4. Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# 5. Verify healthy status
docker compose -f docker-compose.prod.yml ps
```

---

## 4. Platform-as-a-Service Deployments

### 4.1 Railway Deployment
1. Connect GitHub repository to Railway.
2. Add a **PostgreSQL** plugin and enable the `vector` extension (`CREATE EXTENSION vector;`).
3. Add a **Redis** plugin.
4. Deploy `apps/api` with Dockerfile: `apps/api/Dockerfile`.
5. Deploy `apps/worker` with Dockerfile: `apps/worker/Dockerfile`.
6. Deploy `apps/web` with Dockerfile: `apps/web/Dockerfile`.
7. Link environment variables using Railway's reference syntax (e.g. `${{Postgres.DATABASE_URL}}`).

### 4.2 Render Deployment
1. Create a **Web Service** for `apps/api` pointing to `apps/api/Dockerfile`.
2. Create a **Background Worker** for `apps/worker` pointing to `apps/worker/Dockerfile`.
3. Create a **Web Service** for `apps/web` pointing to `apps/web/Dockerfile`.
4. Create managed PostgreSQL and Redis instances.

---

## 5. Scaling Workers & Resource Allocation

The BullMQ indexing worker is I/O and CPU intensive during AST parsing:
- **Horizontal Scaling**: Scale worker containers independently:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --scale worker=4
  ```
- **Job Concurrency**: Configured in `apps/worker/src/processors/indexing.processor.ts` (default: 3 concurrent jobs per replica).

---

## 6. Backup Strategy

Automate daily dumps of vector and relational data:
```bash
# Nightly cron backup
0 2 * * * pg_dump -U repomentor -Fc repomentor_prod > /backups/repomentor_$(date +\%F).dump
```
Restore command:
```bash
pg_restore -U repomentor -d repomentor_prod /backups/repomentor_2026-11-02.dump
```

