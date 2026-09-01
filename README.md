# RIDGE — Risk Intelligence for Dynamic Geohazard Evaluation

Real-time landslide risk monitoring for India's North Eastern Region. Ingests live weather data, scores zones with an XGBoost ML model, dispatches tiered alerts, and serves an HTMX/EJS operations dashboard plus a bilingual citizen portal.

## What you get

- **15 monitoring zones** across 7 NER states
- **ML risk scoring** every 15 minutes with SHAP explanations
- **24-hour forecast** trajectories per zone
- **Alert engine** with Advisory / Watch / Warning tiers
- **Operations dashboard** — map, alerts, analytics, admin console
- **Citizen portal** — English and Assamese (অসমীয়া)
- **Firebase auth** (Google + email) with an ops-access approval workflow

## Architecture

```
Open-Meteo / OSM / GSI
        ↓
  Express ingestion (15 min cron)
        ↓
  FastAPI ML service (XGBoost + SHAP)
        ↓
  Alert engine → SMS / SSE / dashboard
        ↓
  HTMX dashboard + citizen portal
```

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Docker](https://docs.docker.com/get-docker/) | 24+ | Required for the recommended setup |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Bundled with Docker Desktop |
| Git | any | To clone the repository |

Optional (local development without Docker):

- Node.js 20+
- Python 3.11+
- PostgreSQL 16 with PostGIS
- Redis 7

## Quick start (Docker)

### 1. Clone and configure

```bash
git clone https://github.com/arvinalmeida192/RIDGE.git
cd RIDGE

cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development. You only need to edit `.env` if you want Firebase authentication (see below).

**Firebase service-account mount:** `docker-compose.yml` expects a file at `./serviceAccountKey.json`. If you are *not* using Firebase yet, create a placeholder so Docker does not mount a broken path:

```bash
echo '{}' > serviceAccountKey.json
```

### 2. Start all services

```bash
docker compose up -d --build
```

First startup can take **2–3 minutes** while the ML service loads the model and health checks pass.

Watch logs:

```bash
docker compose logs -f server
```

### 3. Verify

```bash
curl http://localhost:3002/api/v1/health
```

Open in a browser:

| URL | Description |
|-----|-------------|
| http://localhost:3002 | Landing page |
| http://localhost:3002/dashboard | Operations dashboard |
| http://localhost:3002/citizen | Citizen portal |
| http://localhost:8000/docs | ML service API (Swagger) |

### 4. Sign in (default — no Firebase)

If `FIREBASE_PROJECT_ID` is empty in `.env`, legacy demo login is enabled automatically:

| Portal | URL | Username | Password |
|--------|-----|----------|----------|
| Operations | http://localhost:3002/login | `admin` | `admin` |
| Citizen | http://localhost:3002/citizen/login | `user` | `user` |

## Authentication

RIDGE supports two modes:

### Option A — Legacy login (fastest, good for local dev)

Leave Firebase variables empty in `.env`. Demo credentials above work immediately.

To keep legacy login even when Firebase is configured, set:

```env
LEGACY_LOGIN_ENABLED=true
```

### Option B — Firebase (recommended for real deployments)

1. Create a [Firebase project](https://console.firebase.google.com/)
2. Enable **Email/Password** and **Google** under Authentication → Sign-in method
3. Add `localhost` under Authentication → Settings → Authorized domains
4. Download a service account key (Project settings → Service accounts → Generate new private key)
5. Save it as `serviceAccountKey.json` in the project root (this file is git-ignored)
6. Register a web app in Firebase and copy the SDK config values into `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-web-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
FIREBASE_BOOTSTRAP_ADMIN_EMAILS=you@example.com
LEGACY_LOGIN_ENABLED=false
```

7. Restart:

```bash
docker compose up -d --force-recreate server
```

**Login flows:**

- **Citizen** — `/citizen/login` (sign up or sign in with Google/email)
- **Operations** — `/login` (approved operators and admins only)

**Ops access workflow:**

1. Citizen signs in → sidebar **Ops Access** (`/citizen/access`) → submit a request
2. Admin/operator opens **Admin** (`/admin`) → approve or reject pending requests
3. Approved user can sign in at `/login`

Bootstrap emails in `FIREBASE_BOOTSTRAP_ADMIN_EMAILS` become **admin** on first sign-in (or are promoted on next login if the account already exists).

## Running tests

```bash
# Server (Jest)
cd server && npm install && npm test

# ML service (pytest) — requires Python venv
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

With Docker running, integration tests use the live Postgres instance on port 5432.

## Local development (without Docker)

Run each service separately:

```bash
# Terminal 1 — database & cache (or use Docker for just these)
docker compose up -d postgres redis

# Terminal 2 — ML service
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Terminal 3 — server
cd server
npm install
cp ../.env.example ../.env   # if not done yet
npm run dev
```

Ensure `.env` points `DATABASE_URL` and `REDIS_URL` at your local instances.

## Project structure

```
RIDGE/
├── server/                  Express API + HTMX/EJS dashboard
├── ml-service/              FastAPI ML inference & training
├── archive/prototype-react/   Archived React/Vite UX prototype (not deployed)
├── nginx/                   Production reverse-proxy config
├── docker-compose.yml       Local development stack
├── docker-compose.prod.yml  Production stack
├── .env.example             Environment template (copy to .env)
└── serviceAccountKey.json   Firebase key (you create this; never commit)
```

## Services (Docker)

| Service | Container | Host port | Purpose |
|---------|-----------|-----------|---------|
| server | ridge-server | 3002 | API + dashboard |
| ml-service | ridge-ml | 8000 | Risk scoring & SHAP |
| postgres | ridge-postgres | 5432 | PostGIS database |
| redis | ridge-redis | 6379 | Cache / pub-sub |

## Environment variables

Key settings in `.env` (see `.env.example` for the full list):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `ridge_dev_password` | Postgres password |
| `JWT_SECRET` | (dev default) | Session signing key — **change in production** |
| `DB_MIGRATE_ON_START` | `true` | Auto-run SQL migrations |
| `DB_SEED_ON_START` | `true` | Load demo zones, alerts, users |
| `INGESTION_ENABLED` | `true` | Pull live weather data |
| `SCORING_ENABLED` | `true` | Run ML scoring on schedule |
| `ALERTS_ENABLED` | `true` | Evaluate alert rules |
| `FIREBASE_PROJECT_ID` | (empty) | Set to enable Firebase auth |

## Troubleshooting

**Containers won't start / server crash-loops**

```bash
docker compose logs server
```

If you see `Cannot find package 'firebase-admin'`, the `node_modules` volume is stale:

```bash
docker compose stop server
docker rm -v ridge-server
docker compose up -d --build server
```

**Empty dashboard / no zones**

Ensure seeding ran. Check server logs for `Running database seed`. You can force a re-seed by setting `DB_SEED_ON_START=true` and restarting, or run migrations manually:

```bash
docker compose exec server node src/db/migrate.js
```

**Firebase login shows "Authentication is not configured"**

- Confirm `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, and `FIREBASE_AUTH_DOMAIN` are set in `.env`
- Confirm `serviceAccountKey.json` exists and contains valid JSON
- Restart: `docker compose up -d --force-recreate server`
- Hard-refresh the browser (Ctrl+Shift+R)

**Google sign-in popup fails**

- Enable Google provider in Firebase Console
- Add `localhost` to authorized domains
- The server sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` for popup auth

**Port already in use**

Change the host port in `docker-compose.yml` (e.g. `"3003:3000"` for server) and update bookmarks accordingly.

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | System health + ML metrics |
| `GET /api/v1/zones` | All zones with live risk |
| `GET /api/v1/alerts` | Active alerts |
| `POST /api/v1/scenarios/compute` | What-if simulation |
| `GET /api/v1/events/alerts` | SSE alert stream |
| `GET /api/v1/auth/config` | Auth mode + Firebase web config |

Full API reference: [server/README.md](server/README.md) and [ml-service/README.md](ml-service/README.md).

## Data attribution

- Rainfall & forecasts: [Open-Meteo](https://open-meteo.com)
- Roads & settlements: [OpenStreetMap](https://www.openstreetmap.org) contributors
- Landslide inventory: [Geological Survey of India](https://www.gsi.gov.in)

## License

See repository for license details.

---

Developed by Los Gatos
