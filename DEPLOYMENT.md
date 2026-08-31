# RIDGE — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- 4 GB RAM minimum (8 GB recommended for ML training)
- Ports 80 (production) or 3002/8000 (development)

## Quick Start (Development)

```bash
git clone <repo-url> RIDGE && cd RIDGE
cp .env.example .env
# Edit .env — set JWT_SECRET to a long random string

docker compose up -d --build

# Dashboard: http://localhost:3002
# ML API:    http://localhost:8000/docs
# Health:    http://localhost:3002/api/v1/health
```

Demo credentials: `admin` / `admin`

## Production Deployment

### 1. Configure environment

```bash
cp .env.example .env
```

Required production variables:

```bash
NODE_ENV=production
DB_PASSWORD=<strong-password>
JWT_SECRET=<64-char-random-string>
CORS_ORIGINS=https://ridge.example.com

# Notifications (optional)
MSG91_API_KEY=<your-key>
AUTHORITY_ALERT_EMAIL=ops@example.com
```

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts:
- **postgres** — PostGIS 16 with persistent volume
- **redis** — cache and session backing
- **ml-service** — FastAPI XGBoost inference (port 8000 internal)
- **server** — Express API + HTMX dashboard (port 3000 internal)
- **nginx** — reverse proxy on port 80

### 3. Verify

```bash
curl http://localhost/api/v1/health | jq .
curl http://localhost/ | head -20
```

Expected health response: `"phase": 6`, `"status": "ok"`

### 4. TLS (recommended)

Place certificates in `nginx/certs/` and uncomment the HTTPS block in `nginx/nginx.conf`, then restart nginx.

## Running Tests

```bash
# Server tests (requires Postgres + Redis)
cd server && npm ci && npm test

# ML tests
cd ml-service && pip install -r requirements.txt && pytest -v

# Performance benchmarks (live stack required)
cd server && BASE_URL=http://localhost:3002 npm run benchmark
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

1. Server unit + API + integration tests (PostGIS + Redis services)
2. ML pytest suite
3. Production Docker image build

## Monitoring

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Full system health (DB, Redis, ML, data counts) |
| `GET /api/v1/system/ingestion` | Ingestion job history |
| `GET /status` | Human-readable status page |

Health checks are configured in Docker Compose for all services. The scheduler logs ingestion failures to `system_health`.

## Data Sources

| Source | Data | Update Frequency |
|--------|------|-----------------|
| [Open-Meteo](https://open-meteo.com) | Rainfall, soil moisture, forecasts | Every 15 min |
| [OpenStreetMap](https://www.openstreetmap.org) | Roads, settlements | Monthly |
| [GSI](https://www.gsi.gov.in) | Landslide inventory | On deploy |
| Internal ML | Risk scores, SHAP factors | Every 15 min |

## Backup

```bash
# Database backup
docker exec ridge-postgres pg_dump -U ridge ridge > ridge_backup.sql

# Restore
cat ridge_backup.sql | docker exec -i ridge-postgres psql -U ridge ridge
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| ML service unhealthy | Check `docker logs ridge-ml` — model may need retraining |
| No risk scores | Trigger scoring: `POST /api/v1/system/ingest/scoring` (admin) |
| Alerts not firing | Verify `ALERTS_ENABLED=true` and risk scores exceed thresholds |
| Dashboard 502 | Wait for postgres + ml-service health checks to pass |
