# RIDGE — Regional Integrated Disaster & Geohazard Early-Warning System

Real-time landslide risk monitoring for India's North Eastern Region. Ingests live weather data, scores zones with an XGBoost ML model, dispatches tiered alerts, and serves an HTMX/EJS operations dashboard.

## Architecture

```
Open-Meteo / OSM / GSI
        ↓
  Express Ingestion (15 min cron)
        ↓
  FastAPI ML Service (XGBoost + SHAP)
        ↓
  Alert Engine → SMS / SSE / Dashboard
        ↓
  HTMX Dashboard (10 pages, bilingual citizen portal)
```

## Quick Start

```bash
cp .env.example .env
docker compose up -d --build

# Dashboard:  http://localhost:3002
# ML API:     http://localhost:8000/docs
# Health:     http://localhost:3002/api/v1/health
```

Login: `admin` / `admin` (operations) · `user` / `user` (citizen portal) — or configure Firebase (see [server/README.md](server/README.md#authentication))

## Project Structure

```
RIDGE/
├── server/                  Express API + HTMX dashboard (production)
├── ml-service/              FastAPI ML inference
├── archive/prototype-react/ Archived React/Vite UX prototype (not deployed)
├── nginx/                   Production reverse proxy config
├── docker-compose.yml       Development
├── docker-compose.prod.yml  Production
└── DEPLOYMENT.md            Full deployment guide
```

## Features

- **15 monitoring zones** across 7 NER states
- **ML risk scoring** every 15 minutes with SHAP explanations
- **24-hour forecast** trajectories per zone
- **Alert engine** with Advisory / Watch / Warning tiers and hysteresis
- **Citizen portal** with English and Assamese (অসমীয়া) support
- **What-if scenario** simulator for disaster planning
- **Live dashboard** with Leaflet map, Chart.js analytics, HTMX alert feed

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | System health + ML metrics |
| `GET /api/v1/zones` | All zones with live risk |
| `GET /api/v1/alerts` | Active alerts |
| `POST /api/v1/scenarios/compute` | What-if simulation |
| `GET /api/v1/events/alerts` | SSE alert stream |

See [server/README.md](server/README.md) and [ml-service/README.md](ml-service/README.md) for full API reference.

## Testing

```bash
cd server && npm test          # Jest unit + API tests
cd ml-service && pytest -v     # ML model + API tests
```

CI runs automatically via GitHub Actions on push.

## Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for TLS, monitoring, backup, and troubleshooting.

## Data Attribution

- Rainfall & forecasts: [Open-Meteo](https://open-meteo.com)
- Roads & settlements: [OpenStreetMap](https://www.openstreetmap.org) contributors
- Landslide inventory: [Geological Survey of India](https://www.gsi.gov.in)

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | Database schema, auth, API foundation |
| 2 | ✅ | Live data ingestion (Open-Meteo, OSM, GSI) |
| 3 | ✅ | ML risk model & 24h forecast engine |
| 4 | ✅ | Alert engine & notification dispatch |
| 5 | ✅ | HTMX/EJS dashboard (10 pages) |
| 6 | ✅ | Tests, CI/CD, production deployment |

Full plan: [RIDGE-DEVELOPMENT-PLAN.md](RIDGE-DEVELOPMENT-PLAN.md)
