# RIDGE Server — Phase 5

Express.js API server and HTMX/EJS dashboard for the RIDGE landslide early-warning system.

## Quick Start

```bash
# From project root
cp .env.example .env
docker compose up -d --build

# Dashboard: http://localhost:3002
# API health: http://localhost:3002/api/v1/health
# ML service: http://localhost:8000
```

## Dashboard Pages

| Path | Description |
|------|-------------|
| `/` | Public landing page with live stats |
| `/login` | Operations login (Firebase or legacy) |
| `/citizen/login` | Citizen portal login (Firebase sign-up/sign-in) |
| `/dashboard` | Map, alert feed, risk charts |
| `/zones/:id` | Zone detail — trajectory, SHAP factors, exposure |
| `/alerts` | Active alerts (read-only) |
| `/analytics` | What-if scenario, risk distribution, seasonal charts |
| `/admin` | Access request approvals, system health, zone table |
| `/citizen` | Bilingual citizen portal (EN / অসমীয়া) |
| `/citizen/access` | Apply for operations dashboard access |
| `/citizen/info` | Landslide safety information (bilingual) |
| `/news` | News and advisories |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health + ML + ingestion + alert status |
| GET | `/api/v1/zones` | All zones with live risk |
| GET | `/api/v1/zones/map-data` | GeoJSON for Leaflet map |
| GET | `/api/v1/zones/:id/forecast` | 24h risk trajectory |
| GET | `/api/v1/alerts` | Active alerts (`?state=&tier=&active=true`) |
| GET | `/api/v1/alerts/feed` | Last 10 alerts (JSON or `?format=html`) |
| GET | `/api/v1/analytics/dashboard-stats` | Dashboard KPIs |
| GET | `/api/v1/analytics/risk-distribution` | Risk level counts |
| POST | `/api/v1/scenarios/compute` | What-if disaster simulation (admin) |
| GET | `/api/v1/news` | News items |
| GET | `/api/v1/auth/config` | Auth mode + Firebase web config |
| POST | `/api/v1/auth/firebase-session` | Exchange Firebase ID token for session cookie |
| POST | `/api/v1/auth/request-operational` | Citizen applies for ops access |
| GET | `/api/v1/auth/access-requests` | List pending access requests (admin/operator) |
| POST | `/api/v1/auth/access-requests/:id/review` | Approve or reject request |
| GET | `/api/v1/events/alerts` | SSE live alert stream |
| GET | `/partials/alert-feed` | HTMX alert feed partial |
| GET | `/partials/alert-list` | HTMX alert table partial |

## Authentication

RIDGE supports **Firebase Authentication** (recommended) with two login flows:

1. **Citizen Portal** (`/citizen/login`) — sign up or sign in with email/password
2. **Operations Login** (`/login`) — approved operators/admins only

Citizens can apply for operations access at `/citizen/access`. Admins and operators approve requests on `/admin`.

### Firebase setup

1. Create a Firebase project and enable **Email/Password** and **Google** sign-in providers
2. Add to `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_API_KEY=your-web-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   FIREBASE_BOOTSTRAP_ADMIN_EMAILS=you@example.com
   ```
3. Restart the server. Legacy `admin`/`user` login is disabled unless `LEGACY_LOGIN_ENABLED=true`

### Legacy demo credentials (dev only)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` | admin |
| `user` | `user` | citizen |

Used when Firebase is not configured, or when `LEGACY_LOGIN_ENABLED=true`.

## Frontend Stack

- **EJS** — server-rendered pages with layout wrapping (`src/utils/renderPage.js`)
- **HTMX** — live alert feed (30s poll) and filterable alert list
- **Alpine.js** — what-if sliders, map layer toggles
- **Leaflet** — NER risk map with heatmap and markers
- **Chart.js** — risk distribution, trajectory, seasonal charts
- **Cookie auth** — `ridge_token` JWT for pages; API also accepts Bearer token

## Trigger Jobs (admin)

```bash
TOKEN=$(curl -s -X POST http://localhost:3002/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r .token)

curl -X POST http://localhost:3002/api/v1/system/ingest/scoring \
  -H "Authorization: Bearer $TOKEN"
```

Jobs: `rainfall`, `forecast`, `scoring`, `alerts`, `risk_forecast`, `historical`, `osm`, `gsi`, `terrain`

## Environment

```bash
ALERTS_ENABLED=true
NOTIFICATIONS_ENABLED=true
SCORING_ENABLED=true
MSG91_API_KEY=          # optional — simulates SMS when empty
```
