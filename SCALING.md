# Scaling RIDGE

A practical guide to growing RIDGE from a single-server pilot (like the current AWS deployment) to a production system that handles more zones, users, and traffic.

---

## Where you are today

```
Internet → Nginx (80/443) → Node server (Express + HTMX)
                                  ├── PostgreSQL + PostGIS
                                  ├── Redis
                                  └── ML service (FastAPI + XGBoost)

Cron jobs (ingestion, scoring, alerts) run inside the Node server process every 15 minutes.
```

**Current pilot setup:** one EC2 instance (`t3.micro`) running everything via `docker-compose.prod.yml`. This is fine for demos, ~15 zones, and a small number of concurrent users.

---

## When to scale

| Signal | Likely bottleneck | First action |
|--------|-------------------|--------------|
| CPU pegged during scoring cycles | ML service or ingestion | Upgrade instance or split ML to its own host |
| API latency > 2s under light load | Node server or DB queries | Add DB indexes, then scale server |
| Postgres disk > 70% or slow writes | Database | Move to managed RDS + larger storage |
| OOM kills / swap thrashing | RAM (PostGIS + ML + Node) | Upgrade to `t3.small` or split services |
| >100 concurrent dashboard users | Node + SSE connections | Horizontal server replicas behind a load balancer |
| >50 monitoring zones | Ingestion + ML batch time | Worker queue + parallel scoring |
| SMS/alert backlog | Notification throughput | Dedicated alert worker + rate-limit tuning |

---

## Scaling stages

### Stage 0 — Pilot (now)

- **Infra:** 1× EC2 + Docker Compose
- **Cost:** AWS free tier (~$0–15/mo)
- **Capacity:** ~15 zones, handful of users, 15-min ingestion
- **Deploy:** `./deploy/aws/launch.sh`

**Quick wins before changing architecture:**

1. **Upgrade instance** to `t3.small` (2 GB RAM) if builds or ML health checks fail.
2. **Turn off demo seed** in production: `DB_SEED_ON_START=false`.
3. **Use a real domain + Let's Encrypt** (see `deploy/aws/setup-duckdns-https.sh`).
4. **Add Firebase + MSG91** only when you need real auth/SMS — not required for scaling.

---

### Stage 1 — Sturdier single host

Stay on one machine; reduce risk and improve ops.

| Change | Why |
|--------|-----|
| `t3.small` or `t3.medium` | Headroom for PostGIS + ML model in memory |
| Daily EBS snapshots | Disaster recovery |
| CloudWatch alarms (CPU, disk, 5xx) | Know before users do |
| `DB_SEED_ON_START=false` | No accidental demo data overwrite |
| Proper TLS (not self-signed) | Mobile browsers, Firebase auth |

```bash
# On EC2 — resize instance type in AWS Console, then:
cd /opt/ridge && sudo docker compose -f docker-compose.prod.yml up -d
```

---

### Stage 2 — Split the database and cache

**First architectural split.** Move stateful services off the app server.

```
                    ┌─ Node server (EC2)
Internet → ALB ─────┤
                    └─ (optional 2nd Node replica)

Node server → Amazon RDS (PostgreSQL 16 + PostGIS)
           → Amazon ElastiCache (Redis)
           → ML service (same EC2 or separate EC2)
```

| Service | AWS option | Notes |
|---------|------------|-------|
| Database | **RDS PostgreSQL** with PostGIS extension | Enable automated backups, Multi-AZ when you need HA |
| Cache | **ElastiCache Redis** | Sessions, rate limits, job locks (future) |
| App | EC2 or **ECS Fargate** | Run `server` + `nginx` containers |
| ML | EC2 `t3.small` or Fargate | ML container is memory-heavy; keep separate |

**Migration steps:**

1. Create RDS instance (PostgreSQL 16, enable PostGIS).
2. Dump and restore from pilot:
   ```bash
   docker exec ridge-postgres pg_dump -U ridge ridge | psql $RDS_DATABASE_URL
   ```
3. Update `.env`:
   ```
   DATABASE_URL=postgresql://ridge:PASSWORD@your-rds.ap-south-1.rds.amazonaws.com:5432/ridge
   REDIS_URL=redis://your-elasticache.cache.amazonaws.com:6379
   ```
4. Redeploy server without the `postgres` and `redis` containers.

---

### Stage 3 — Horizontal app tier

When one Node process cannot serve enough HTTP/SSE traffic.

```
Internet → ALB (HTTPS)
              ├── Node replica 1  ─┐
              ├── Node replica 2  ─┼→ RDS + ElastiCache + ML service
              └── Node replica N  ─┘
```

**Requirements:**

| Concern | Solution |
|---------|----------|
| Session stickiness | ALB sticky sessions **or** store sessions in Redis |
| SSE alert stream (`/api/v1/events/alerts`) | Sticky sessions, or Redis pub/sub broadcast to all replicas |
| Cron / ingestion | **Run on one instance only** — see Stage 4 |
| Static assets | S3 + CloudFront, or nginx caching |

**ECS Fargate sketch:**

- Task definition: `server` container (port 3000)
- Service: `desiredCount: 2`, behind ALB target group
- Separate ECS service for `ml-service`
- RDS + ElastiCache as managed dependencies

---

### Stage 4 — Background workers

Ingestion and scoring currently run inside `server/src/scheduler.js`. At scale, **only one process should run cron jobs**.

**Pattern:**

```
Worker EC2/ECS task (INGESTION_ENABLED=true, serves no HTTP)
   └── cron: rainfall → terrain → scoring → alerts

Web EC2/ECS tasks (INGESTION_ENABLED=false)
   └── API + dashboard only
```

Add to `.env` on web replicas:

```
INGESTION_ENABLED=false
INGESTION_ON_START=false
```

Add to worker:

```
INGESTION_ENABLED=true
PORT=3001  # health only, or separate health endpoint
```

**Next step beyond that:** move jobs to a queue (BullMQ + Redis, or AWS SQS + Lambda) so scoring can parallelize per zone.

---

### Stage 5 — Data and ML scale

| Growth | Approach |
|--------|----------|
| 15 → 100 zones | Batch ML calls; consider async queue per zone |
| 100 → 1000 zones | Partition ingestion by region; multiple ML workers |
| Richer terrain (GEE) | Separate GEE ingestion worker; store rasters in S3 |
| Model retraining | Scheduled job on GPU instance or SageMaker; version models in S3 |
| Historical archive | Move old `sensor_readings` to S3 (Parquet) + RDS hot window |

ML service is stateless except the model file — scale replicas horizontally once scoring is queued:

```
Scoring worker → POST /score (batch) → ML service replica pool
```

---

## Service-by-service cheat sheet

### Node server (`server/`)

- **Scale out:** multiple replicas behind ALB
- **Scale up:** more CPU for HTMX rendering and API
- **Watch:** DB connection pool size (`pg` default ~10 per instance × replicas)

### PostgreSQL + PostGIS

- **Scale up:** larger RDS instance, read replica for analytics
- **Indexes:** ensure indexes on `zone_id`, `recorded_at` for time-series queries
- **Backups:** RDS automated backups + periodic `pg_dump` to S3

### Redis

- **Today:** health checks only; lightly used
- **At scale:** session store, rate limiting, SSE fan-out, BullMQ job queue
- **AWS:** ElastiCache `cache.t3.micro` → cluster mode if needed

### ML service (`ml-service/`)

- **Bottleneck:** model load (~2 min startup), CPU during batch scoring
- **Scale:** dedicated instance; 2+ replicas behind internal load balancer
- **Cold start:** keep `start_period` health check generous; pre-warm on deploy

### Nginx

- **Today:** TLS termination + reverse proxy on same host
- **At scale:** AWS ALB terminates TLS; nginx optional inside containers

---

## Geographic and reliability

| Goal | Option |
|------|--------|
| Single region (India) | `ap-south-1` (Mumbai) — current |
| High availability | RDS Multi-AZ + 2 app replicas in different AZs |
| Disaster recovery | Cross-region RDS read replica + S3 backup |
| CDN for citizens | CloudFront in front of static assets and cacheable API responses |

---

## Security at scale

- Move secrets to **AWS Secrets Manager** (DB password, JWT, Firebase JSON, MSG91 key)
- Restrict RDS/ElastiCache security groups to app tier only
- Use **IAM roles** on EC2/ECS instead of long-lived access keys
- Enable **WAF** on ALB if the citizen portal is public
- Set `LEGACY_LOGIN_ENABLED=false` in production

---

## Cost rough guide (ap-south-1)

| Stage | Monthly estimate |
|-------|------------------|
| Pilot (t3.micro) | $0–10 (free tier) |
| Stage 1 (t3.small + EIP) | ~$20–30 |
| Stage 2 (+ RDS db.t3.micro + ElastiCache) | ~$60–100 |
| Stage 3 (+ ALB + 2× Fargate tasks) | ~$150–250 |
| Stage 5 (larger RDS, ML host, CloudFront) | $300+ |

Use **AWS Cost Explorer** and set billing alarms early.

---

## Recommended path

```
Pilot (now)
   ↓  real users, HTTPS, monitoring
Stage 1 — bigger EC2, backups, alarms
   ↓  DB disk/CPU pressure, need uptime
Stage 2 — RDS + ElastiCache
   ↓  concurrent users, slow API
Stage 3 — ALB + multiple server replicas
   ↓  ingestion conflicts, long cron runs
Stage 4 — dedicated worker + job queue
   ↓  more zones, bigger models
Stage 5 — ML pool, data lake, regional workers
```

---

## Related files

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production stack definition |
| `deploy/aws/launch.sh` | One-command EC2 deploy |
| `deploy/aws/README.md` | AWS free-tier setup |
| `deploy/aws/setup-duckdns-https.sh` | Free subdomain + TLS |
| `server/src/scheduler.js` | Ingestion cron (split at Stage 4) |
| `CODEBASE.md` | Full architecture walkthrough |

---

## Quick checklist before going public

- [ ] `DB_SEED_ON_START=false`
- [ ] Strong `DB_PASSWORD` and `JWT_SECRET`
- [ ] Firebase authorized domains include your public URL
- [ ] HTTPS with a valid certificate (not self-signed)
- [ ] EBS snapshots or RDS backups enabled
- [ ] CloudWatch (or similar) alerts on CPU, disk, and `/api/v1/health`
- [ ] MSG91 configured if SMS alerts are required
