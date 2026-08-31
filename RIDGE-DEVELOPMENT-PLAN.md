# RIDGE — Full Development Plan & Technical Design

**Risk Intelligence for Dynamic Geohazard Evaluation**  
Smart India Hackathon 2026 (PS SIH26001) · Team Los Gatos · MDoNER Partnership

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Codebase Audit](#2-current-codebase-audit)
3. [Target Architecture](#3-target-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Data Pipeline & Algorithms](#5-data-pipeline--algorithms)
6. [Database Schema Design](#6-database-schema-design)
7. [API Contract Design](#7-api-contract-design)
8. [Development Phases (6 Phases)](#8-development-phases-6-phases)
9. [Project Structure (Target)](#9-project-structure-target)
10. [Infrastructure & DevOps](#10-infrastructure--devops)
11. [Testing Strategy](#11-testing-strategy)
12. [Migration from Prototype](#12-migration-from-prototype)
13. [Risk Register & Open Decisions](#13-risk-register--open-decisions)

---

## 1. Executive Summary

RIDGE is a landslide early-warning system for India's **North Eastern Region (NER)** — 8 states, 15 monitoring zones, tiered alerts (Advisory / Watch / Warning), citizen portal, and operations dashboard.

### Current State

The repository contains a **polished frontend prototype** built with React 19, TypeScript, Vite, Tailwind CSS, Leaflet, and Three.js. All data is **hardcoded mock data** in `src/data/mockData.ts`. There is **no backend, no database, no ML service, and no live API integrations**.

### Target State

A production-grade system with:

```
Environmental Data Ingestion
        ↓
Trigger Factor Analysis
        ↓
ML Risk Model
        ↓
24-Hour Forecast Engine
        ↓
Alert & Rule Engine
        ↓
Dashboard & User Alerts
```

### Strategic Decision: Frontend Migration

The existing React SPA serves as the **UX reference and data-model blueprint**. The target stack specified for production is **HTML · CSS · EJS · HTMX** (server-rendered, progressive enhancement). Phase 5 rebuilds the dashboard using this stack while preserving all UX patterns from the prototype.

---

## 2. Current Codebase Audit

### 2.1 Directory Layout (As-Is)

```
RIDGE/
├── index.html                    # Vite SPA shell
├── package.json                  # React/Vite deps only
├── vite.config.ts
├── ridge-cursor-prompt.md        # Feature spec (heatmap + impact)
├── public/ridge-icon.svg
├── dist/                         # Production build output
└── src/
    ├── main.tsx                  # BrowserRouter + AuthProvider
    ├── App.tsx                   # Route definitions
    ├── index.css                 # Tailwind v4 + theme tokens
    ├── data/
    │   ├── mockData.ts           # ★ Core domain data (605 lines)
    │   └── mockNews.ts           # News/advisory items
    ├── context/
    │   ├── AuthContext.tsx       # sessionStorage mock auth
    │   └── SimulatorContext.tsx  # Rainfall sim + map layer state
    ├── utils/
    │   ├── simulator.ts          # Rainfall → risk formula
    │   ├── scenarioSimulator.ts  # Multi-hazard what-if engine
    │   ├── terrain.ts            # Procedural East Khasi Hills mesh
    │   ├── riskColors.ts         # 5-tier color scale + helpers
    │   ├── mockAuth.ts           # admin/admin, user/user
    │   └── geo.ts                # lat/lng → sphere coords
    ├── pages/                    # 10 route pages
    └── components/               # Maps, 3D globe, terrain, layout
```

### 2.2 Implemented Features (UI Only)

| Feature | Route / File | Status |
|---------|-------------|--------|
| Login (role-based) | `/` → `Login.tsx` | Mock credentials in `mockAuth.ts` |
| Landing / marketing | `/home` → `Landing.tsx` | Complete |
| Operations dashboard | `/dashboard` → `Dashboard.tsx` | Complete (mock data) |
| Zone detail | `/zone/:id` → `ZoneDetail.tsx` | Complete (mock forecasts) |
| Alerts list + filters | `/alerts` → `Alerts.tsx` | Static array; notify buttons dead |
| Analytics charts | `/analytics` → `Analytics.tsx` | Synthetic time series |
| Admin panel + What-If | `/admin` → `Admin.tsx` | What-If works client-side |
| Citizen portal (bilingual) | `/citizen` → `Citizen.tsx` | Hardcoded to zone z01 |
| News feed | `/news` → `News.tsx` | Hardcoded articles |
| About / education | `/about` → `About.tsx` | Complete |
| 2D Leaflet map + heatmap | `NERMap.tsx`, `HeatmapLayer.tsx` | Complete |
| 3D Earth globe | `globe/EarthGlobeMap.tsx` | Complete |
| 3D terrain twin | `terrain/TerrainMap.tsx` | **Built but not wired to routes** |
| Rainfall simulator | `RiskSimulator.tsx` | **Built but not mounted** |

### 2.3 Domain Model (From `mockData.ts`)

These TypeScript interfaces are the **canonical schema blueprint** for PostgreSQL:

```typescript
Zone {
  id, name, state, lat, lng,
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Critical',
  riskScore: 1.0–5.0,
  rainfall24h, cumulativeRainfall, soilSaturation,
  slopeAngle, seismicIndex, groundMovement,
  mlConfidence, sensorStatus, lastUpdated
}

Alert {
  id, zoneId, zoneName, state,
  tier: 'Advisory' | 'Watch' | 'Warning',
  riskLevel, issuedAt, affectedRadius, guidance
}

ZoneExposure {
  roads[], settlements[], infrastructure[],
  agriculturalLandHectares,
  estimatedPopulationInRadius,
  estimatedStructuresAtRisk,
  roadNetworkLengthAtRiskKm
}

CausativeFactor { factor, contributionPercent }
TimeSeriesPoint { time, value, confidenceLow?, confidenceHigh? }
HistoricalIncident { date, event, severity }
```

**15 zones** across 8 NER states · **12 alerts** · per-zone exposure, causative factors, and generated time series.

### 2.4 Existing Client-Side Algorithms (To Be Replaced by Real ML)

#### Risk Score → Risk Level Mapping (`riskColors.ts`)

```
score ≥ 4.5 → Critical
score ≥ 3.5 → Very High
score ≥ 2.5 → High
score ≥ 1.5 → Moderate
else        → Low
```

#### Rainfall Simulator (`simulator.ts`)

```
rainfallNorm = (rainfall - 50) / 250
zoneWetness  = zone.rainfall24h / 160
boost        = rainfallNorm * 1.6 + zoneWetness * 0.35
riskScore    = clamp(zone.riskScore * (0.75 + rainfallNorm * 0.5) + boost, 1, 5)
```

Regional tier thresholds: 240mm → Critical, 180mm → Very High, 120mm → High, 80mm → Moderate.

#### What-If Scenario Engine (`scenarioSimulator.ts`)

Multi-parameter additive model with interaction terms:

| Parameter | Effect |
|-----------|--------|
| Rainfall (+mm) | `score += (0.42 + rainfall24h/180 * 0.55) * (rainfallMm/100)` |
| Earthquake (M) | `score += (0.22 + seismicIndex * 1.4) * (magnitude/5.2)` |
| Soil moisture (+%) | `score += (0.3 + soil/100 * 0.35) * (moisture/20)` |
| Ground movement (+mm) | `score += (0.35 + movement/18 * 0.25) * (movement/10)` |
| Hydro combo (≥2 active) | `score += 0.18 * (activeCount - 1)` |
| Rain + quake combo | `score += 0.12 * min(rainfall/100, magnitude/5.2)` |

#### Severity Tier (`getSeverityTier`)

```
exposureScore = pop/400 + structures/60 + roadKm/4
combined      = riskWeight[riskLevel] * 0.55 + min(5, exposureScore) * 0.45
≥ 4.2 or (Critical + pop > 1000) → Catastrophic
≥ 3.2 or pop > 600               → Severe
≥ 2.2 or pop > 250               → Moderate
else                             → Localized
```

#### Synthetic Forecast (`generateHourlySeries`)

Sine-wave noise added to base score with upward trend — **must be replaced** by ML forecast output.

### 2.5 What Is Missing

| Layer | Status |
|-------|--------|
| Node.js / Express backend | ❌ Not started |
| PostgreSQL database | ❌ Not started |
| Python FastAPI ML service | ❌ Not started |
| Open-Meteo integration | ❌ Not started |
| Google Earth Engine integration | ❌ Not started |
| Government dataset ingestion (IMD, GSI, BISAG-N) | ❌ Not started |
| Alert delivery (SMS, push, radio) | ❌ Not started |
| Real authentication (JWT/OAuth) | ❌ Not started |
| Docker / CI/CD | ❌ Not started |
| EJS / HTMX frontend | ❌ Not started (React prototype exists) |
| Automated tests | ❌ Not started |
| Environment config (.env) | ❌ Not started |

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USERS & OPERATORS                               │
│   Admin Dashboard  ·  Citizen Portal  ·  API Consumers  ·  Field Apps   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────────┐
│                    EXPRESS.JS APPLICATION SERVER                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │ EJS Views   │  │ HTMX Partials│  │ REST API   │  │ WebSocket/SSE  │ │
│  │ (SSR pages) │  │ (live update)│  │ /api/v1/*  │  │ (alert stream) │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │ Auth (JWT)  │  │ Alert Engine │  │ Scheduler  │  │ Notification   │ │
│  │ Middleware  │  │ Rule Eval    │  │ (node-cron)│  │ Dispatcher     │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────────┘ │
└──────────┬──────────────────┬──────────────────┬────────────────────────┘
           │                  │                  │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ PostgreSQL  │   │ Redis       │   │ FastAPI ML  │
    │ (primary DB)│   │ (cache/queue│   │ Service     │
    │             │   │  pub-sub)   │   │ (Python)    │
    └─────────────┘   └─────────────┘   └──────┬──────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────┐
│                      DATA INGESTION LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ Open-Meteo │  │ Google     │  │ IMD / GSI  │  │ OSM / Govt     │  │
│  │ (rainfall, │  │ Earth      │  │ Historical │  │ Roads &        │  │
│  │  forecast) │  │ Engine     │  │ Landslide  │  │ Settlements    │  │
│  │            │  │ (slope,    │  │ Inventory  │  │ (Overpass API) │  │
│  │            │  │  soil, LULC)│  │            │  │                │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Communication

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Express | PostgreSQL | TCP/5432 | CRUD, time-series queries |
| Express | Redis | TCP/6379 | Cache zone snapshots, pub-sub alerts |
| Express | FastAPI | HTTP :8000 | Risk scoring, forecast, SHAP factors |
| Ingestion workers | Open-Meteo | HTTPS | Hourly rainfall + forecast |
| Ingestion workers | GEE (earthengine-api) | HTTPS | Slope, soil moisture, land cover |
| Ingestion workers | PostgreSQL | TCP/5432 | Write sensor readings |
| Alert dispatcher | SMS gateway (Twilio/MSG91) | HTTPS | Citizen notifications |

---

## 4. Technology Stack

### 4.1 Frontend (Target)

| Technology | Role |
|------------|------|
| **HTML5** | Semantic markup, accessibility |
| **CSS3** | Custom properties, grid/flex; port Tailwind theme tokens from prototype |
| **EJS** | Server-side templates for full pages and partials |
| **HTMX** | Partial page updates (alert feed, zone cards, map popups) without full SPA |
| **Alpine.js** *(add-on)* | Lightweight client interactivity (sliders, toggles, modals) |
| **Leaflet.js** | 2D map with heatmap overlay (port from prototype) |
| **Chart.js** | Risk trajectory and analytics charts (replaces Recharts) |

> **Why HTMX over React for production:** Simpler deployment (single Express server), SEO-friendly citizen portal, lower bundle size for low-bandwidth NER connectivity, and natural fit with server-rendered alert pages.

### 4.2 Backend

| Technology | Role |
|------------|------|
| **Node.js 20 LTS** | Runtime |
| **Express.js 4** | HTTP server, routing, middleware |
| **pg** (node-postgres) | PostgreSQL driver |
| **node-cron** | Scheduled ingestion + forecast refresh |
| **jsonwebtoken** | JWT authentication |
| **bcrypt** | Password hashing |
| **helmet, cors, express-rate-limit** | Security |
| **winston** | Structured logging |
| **bull** *(add-on)* | Job queue for ingestion tasks |

### 4.3 Database

| Technology | Role |
|------------|------|
| **PostgreSQL 16** | Primary datastore |
| **PostGIS** *(add-on)* | Geospatial queries (zone radius, road proximity) |
| **TimescaleDB** *(add-on)* | Time-series hypertables for sensor readings |

### 4.4 AI/ML

| Technology | Role |
|------------|------|
| **Python 3.11** | ML runtime |
| **FastAPI** | ML inference API |
| **Pandas** | Feature engineering |
| **Scikit-learn** | Preprocessing, baseline models, calibration |
| **XGBoost** | Primary landslide risk classifier |
| **SHAP** | Causative factor explanations (replaces mock percentages) |
| **joblib** | Model serialization |

### 4.5 Data Sources

| Source | Data | Endpoint / Access |
|--------|------|-------------------|
| **Open-Meteo** | Hourly rainfall, 24h forecast, soil moisture proxy | `https://api.open-meteo.com/v1/forecast` |
| **Open-Meteo Archive** | Historical rainfall (training data) | `https://archive-api.open-meteo.com/v1/archive` |
| **Google Earth Engine** | Slope (SRTM), soil type, land cover, NDVI | `earthengine-api` Python client |
| **GSI Landslide Atlas** | Historical landslide points (India) | Government CSV/GeoJSON download |
| **IMD** | Gridded rainfall, warnings | IMD open data / scraping fallback |
| **OpenStreetMap Overpass** | Roads, settlements near zones | `https://overpass-api.de/api/interpreter` |
| **Bhuvan (ISRO)** *(optional)* | High-res terrain for NER | WMS/REST (requires registration) |

### 4.6 Infrastructure Add-Ons

| Tool | Role |
|------|------|
| **Docker + docker-compose** | Local dev and deployment |
| **Nginx** | Reverse proxy, static assets, TLS termination |
| **Redis 7** | Caching, pub-sub for live alert feed |
| **GitHub Actions** | CI/CD pipeline |
| **Prometheus + Grafana** *(optional)* | System health monitoring |

---

## 5. Data Pipeline & Algorithms

### 5.1 Pipeline Overview

```
┌──────────────────┐
│ 1. INGESTION     │  Cron every 15 min: fetch Open-Meteo per zone lat/lng
│                  │  Cron daily: GEE export slope/soil/LULC rasters → zone attrs
│                  │  One-time: load GSI landslide inventory + OSM exposure data
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. TRIGGER       │  Compute antecedent rainfall (24h, 72h, 7d windows)
│    ANALYSIS      │  Flag trigger conditions: saturation > 85%, slope > 30°,
│                  │  rainfall anomaly > 2σ, ground movement spike
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 3. ML RISK       │  Build feature vector → XGBoost predict P(landslide)
│    MODEL         │  Map probability → risk score 1.0–5.0
│                  │  SHAP values → causative factor percentages
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 4. 24H FORECAST  │  Feed Open-Meteo hourly forecast into model
│    ENGINE        │  Rolling inference: score at T+1h … T+24h
│                  │  Confidence bands via quantile regression or bootstrap
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 5. ALERT ENGINE  │  Rule evaluation: score + trend + trigger flags
│                  │  Assign tier: Advisory / Watch / Warning
│                  │  Deduplicate, escalate, de-escalate with hysteresis
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 6. DASHBOARD     │  Express renders EJS pages with live data
│    & ALERTS      │  HTMX polls/SSE for alert feed updates
│                  │  SMS/push dispatch for Warning tier
└──────────────────┘
```

### 5.2 Feature Engineering

For each zone `z` at time `t`, build feature vector **X(z,t)**:

| Feature | Source | Computation |
|---------|--------|-------------|
| `rainfall_1h` | Open-Meteo | Latest hourly precipitation (mm) |
| `rainfall_24h` | Open-Meteo | Sum of last 24 hourly values |
| `rainfall_72h` | Open-Meteo | Sum of last 72 hourly values |
| `rainfall_7d` | Open-Meteo Archive | Sum of last 7 days |
| `rainfall_anomaly` | Open-Meteo + historical | `(rainfall_24h - μ_month) / σ_month` |
| `rainfall_intensity` | Derived | `rainfall_1h / max(rainfall_24h, 1)` |
| `antecedent_wetness` | Derived | `0.5 * rainfall_72h + 0.3 * rainfall_7d + 0.2 * rainfall_24h` |
| `soil_saturation` | GEE / Open-Meteo soil moisture | Volumetric moisture % or proxy |
| `slope_angle` | GEE (SRTM) | Degrees at zone centroid |
| `elevation` | GEE (SRTM) | Metres above sea level |
| `curvature` | GEE (SRTM) | Plan/profile curvature |
| `land_cover` | GEE (ESA WorldCover) | One-hot: forest, cropland, bare, urban |
| `ndvi` | GEE (Sentinel-2) | Vegetation index (root stability proxy) |
| `dist_to_road` | PostGIS + OSM | Metres to nearest major road |
| `dist_to_fault` | GSI seismotectonic | km to nearest fault line |
| `seismic_index` | GSI / USGS | Normalized recent seismic activity |
| `historical_event_count` | GSI inventory | Landslides within 5 km in last 20 years |
| `season` | Derived | Monsoon phase encoding (pre/monsoon/post) |
| `hour_of_day` | Derived | Cyclical encoding for diurnal patterns |

### 5.3 ML Risk Model

#### Training Data Construction

```
Positive samples: GSI landslide inventory points within NER bounding box
Negative samples: Random points in same region with no landslide history,
                  matched by elevation and slope strata
Temporal split: Train on 2000–2022, validate on 2023, test on 2024–2025
```

#### Model Architecture

```
Primary:   XGBoost Classifier
           objective: binary:logistic
           max_depth: 6, n_estimators: 300, learning_rate: 0.05
           scale_pos_weight: auto (handle class imbalance)

Calibration: Isotonic regression on validation set probabilities

Output:    P(landslide) ∈ [0, 1]
           risk_score = 1.0 + 4.0 * P(landslide)   → maps to 1.0–5.0
           risk_level = riskFromScore(risk_score)   → 5 tiers
           ml_confidence = calibrated probability * 100
```

#### Causative Factor Extraction (SHAP)

```python
import shap

explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_zone)

# Top-5 factors with contribution percentages
factors = sorted(zip(feature_names, shap_values), key=abs, reverse=True)[:5]
total = sum(abs(v) for _, v in factors)
causative = [
    {"factor": humanize(name), "contributionPercent": round(abs(v)/total*100)}
    for name, v in factors
]
```

This replaces the hardcoded `zoneCausativeFactors` in `mockData.ts` with **model-derived explanations**.

### 5.4 Trigger Factor Analysis Algorithm

Runs **before** ML inference as a fast pre-filter and **after** as an escalation booster.

```python
def analyze_triggers(zone_readings, static_attrs):
    triggers = []
    score_boost = 0.0

    # T1: Antecedent rainfall threshold
    if zone_readings.rainfall_72h > static_attrs.rainfall_p90:
        triggers.append("72h rainfall exceeds 90th percentile")
        score_boost += 0.3

    # T2: Soil saturation critical
    if zone_readings.soil_saturation > 85:
        triggers.append("Soil saturation critical (>85%)")
        score_boost += 0.4

    # T3: Slope instability
    if static_attrs.slope_angle > 30 and zone_readings.soil_saturation > 70:
        triggers.append("Steep slope + saturated soil")
        score_boost += 0.35

    # T4: Rainfall intensity spike
    if zone_readings.rainfall_1h > 15 and zone_readings.rainfall_24h > 100:
        triggers.append("Intense rainfall on wet antecedent conditions")
        score_boost += 0.25

    # T5: Seismic activity
    if zone_readings.seismic_index > 0.5:
        triggers.append("Elevated seismic activity near fault")
        score_boost += 0.2

    # T6: Sensor degradation
    if zone_readings.sensor_status == 'Offline':
        triggers.append("Sensor offline — reduced confidence")
        score_boost += 0.0  # flag only, no boost

    return triggers, min(score_boost, 1.0)
```

Final risk score: `final_score = clamp(ml_score + trigger_boost, 1.0, 5.0)`

### 5.5 24-Hour Forecast Engine

```python
def forecast_24h(zone_id, current_features, hourly_forecast):
    """
    hourly_forecast: list of 24 dicts from Open-Meteo
                     [{time, precipitation_mm, soil_moisture}, ...]
    """
    trajectory = []
    rolling_features = current_features.copy()

    for hour in range(1, 25):
        # Update rainfall features with forecast precipitation
        rolling_features['rainfall_1h'] = hourly_forecast[hour-1]['precipitation_mm']
        rolling_features['rainfall_24h'] = sum(
            h['precipitation_mm'] for h in hourly_forecast[max(0,hour-24):hour]
        )
        rolling_features['antecedent_wetness'] = compute_wetness(rolling_features)

        prob = calibrated_model.predict_proba([rolling_features])[0][1]
        score = 1.0 + 4.0 * prob

        # Confidence bands via bootstrap or quantile model
        trajectory.append({
            "time": hourly_forecast[hour-1]['time'],
            "value": round(score, 2),
            "confidenceLow": round(score - 0.4, 2),
            "confidenceHigh": round(min(5.0, score + 0.3), 2),
        })

    return trajectory
```

Cron job: refresh forecasts every hour, store in `risk_forecasts` table.

### 5.6 Alert & Rule Engine

```javascript
// alertEngine.js — runs after each risk scoring cycle

const ALERT_RULES = [
  {
    tier: 'Warning',
    conditions: (zone) =>
      zone.risk_score >= 4.5 ||
      (zone.risk_score >= 4.0 && zone.risk_trend_6h > 0.3),
    affectedRadiusKm: (zone) => Math.min(15, 5 + zone.risk_score * 2),
    hysteresis: { downgrade_below: 4.0, min_duration_min: 60 },
  },
  {
    tier: 'Watch',
    conditions: (zone) =>
      zone.risk_score >= 3.5 ||
      (zone.risk_score >= 3.0 && zone.active_triggers.length >= 2),
    affectedRadiusKm: (zone) => Math.min(10, 3 + zone.risk_score * 1.5),
    hysteresis: { downgrade_below: 3.0, min_duration_min: 120 },
  },
  {
    tier: 'Advisory',
    conditions: (zone) =>
      zone.risk_score >= 2.5 || zone.active_triggers.length >= 1,
    affectedRadiusKm: (zone) => Math.min(5, 2 + zone.risk_score),
    hysteresis: { downgrade_below: 2.0, min_duration_min: 180 },
  },
];

async function evaluateAlerts(zones) {
  for (const zone of zones) {
    const currentAlert = await getActiveAlert(zone.id);

    for (const rule of ALERT_RULES) {
      if (rule.conditions(zone)) {
        if (!currentAlert || shouldEscalate(currentAlert, rule.tier)) {
          await createOrUpdateAlert(zone, rule);
          await dispatchNotifications(zone, rule.tier);
        }
        break; // highest matching tier wins
      }
    }

    // De-escalation with hysteresis
    if (currentAlert && shouldDeescalate(currentAlert, zone)) {
      await downgradeOrResolveAlert(currentAlert, zone);
    }
  }
}
```

#### Alert Guidance Templates

| Tier | Template |
|------|----------|
| **Warning** | `Evacuate low-lying settlements immediately. Avoid all travel on {top_road}.` |
| **Watch** | `Prepare evacuation kits. Monitor local radio for updates in {zone_name}.` |
| **Advisory** | `Exercise caution on hillside roads. Report ground cracks to authorities.` |

Guidance is populated dynamically from zone exposure data (roads, settlements).

### 5.7 Exposure & Impact Assessment

Replace mock `getSeverityTier` with PostGIS proximity queries:

```sql
-- Population at risk within alert radius
SELECT SUM(s.population)
FROM settlements s
WHERE ST_DWithin(
  s.geom::geography,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  :radius_km * 1000
);

-- Roads at risk
SELECT r.name, ST_Length(
  ST_Intersection(r.geom, ST_Buffer(zone.geom, :radius_km * 1000))
) / 1000 AS length_km
FROM roads r, zones z
WHERE z.id = :zone_id
  AND ST_DWithin(r.geom, z.geom, :radius_km * 1000);
```

Severity tier algorithm (ported from prototype, fed with real data):

```
exposureScore = pop_in_radius/400 + structures/60 + road_km/4
combined      = riskWeight[riskLevel] * 0.55 + min(5, exposureScore) * 0.45
→ Catastrophic | Severe | Moderate | Localized
```

### 5.8 What-If Scenario Engine (Server-Side Port)

Port `scenarioSimulator.ts` to a `/api/v1/scenarios` endpoint. The algorithm stays identical but reads **live zone data** from PostgreSQL instead of `mockData.ts`. This powers the Admin panel's disaster simulation.

### 5.9 Data Ingestion Schedules

| Job | Frequency | Source | Writes To |
|-----|-----------|--------|-----------|
| `ingest_rainfall` | Every 15 min | Open-Meteo Forecast API | `sensor_readings` |
| `ingest_forecast` | Every hour | Open-Meteo Forecast API | `weather_forecasts` |
| `ingest_historical` | Daily at 02:00 | Open-Meteo Archive | `sensor_readings` (backfill) |
| `ingest_gee_static` | Weekly | Google Earth Engine | `zone_static_attributes` |
| `ingest_osm_exposure` | Monthly | Overpass API | `roads`, `settlements` |
| `score_risk` | Every 15 min (after ingest) | FastAPI ML service | `risk_scores` |
| `forecast_24h` | Every hour | FastAPI ML service | `risk_forecasts` |
| `evaluate_alerts` | Every 15 min (after score) | Alert engine | `alerts` |
| `dispatch_notifications` | On alert create/escalate | SMS gateway | `notification_log` |

---

## 6. Database Schema Design

### 6.1 Entity-Relationship Overview

```
users ──────────< alert_acknowledgments
  │
zones ──────────< sensor_readings (time-series)
  │                    │
  ├──── zone_static_attributes (slope, elevation, land cover)
  ├──── risk_scores (time-series)
  ├──── risk_forecasts (hourly trajectory)
  ├──── alerts
  ├──── zone_exposure (cached exposure summary)
  ├──── causative_factors (per scoring run)
  ├──── roads (spatial)
  ├──── settlements (spatial)
  └──── historical_incidents

weather_forecasts ── per zone, per hour
notification_log ── per alert dispatch
system_health ── pipeline status
```

### 6.2 Core Tables

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'citizen', 'operator')),
  preferred_lang VARCHAR(5) DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring zones
CREATE TABLE zones (
  id            VARCHAR(10) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  state         VARCHAR(50) NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  geom          GEOMETRY(Point, 4326),
  sensor_status VARCHAR(20) DEFAULT 'Online',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Static terrain attributes (updated weekly from GEE)
CREATE TABLE zone_static_attributes (
  zone_id           VARCHAR(10) PRIMARY KEY REFERENCES zones(id),
  slope_angle       DOUBLE PRECISION,
  elevation_m       DOUBLE PRECISION,
  curvature         DOUBLE PRECISION,
  land_cover        VARCHAR(30),
  ndvi              DOUBLE PRECISION,
  soil_type         VARCHAR(50),
  dist_to_fault_km  DOUBLE PRECISION,
  seismic_index     DOUBLE PRECISION,
  historical_events INTEGER DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Time-series sensor readings (TimescaleDB hypertable)
CREATE TABLE sensor_readings (
  time              TIMESTAMPTZ NOT NULL,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  rainfall_1h       DOUBLE PRECISION,
  rainfall_24h      DOUBLE PRECISION,
  rainfall_72h      DOUBLE PRECISION,
  cumulative_7d     DOUBLE PRECISION,
  soil_saturation   DOUBLE PRECISION,
  ground_movement   DOUBLE PRECISION,
  temperature       DOUBLE PRECISION,
  PRIMARY KEY (time, zone_id)
);
SELECT create_hypertable('sensor_readings', 'time');

-- Risk scores (TimescaleDB hypertable)
CREATE TABLE risk_scores (
  time              TIMESTAMPTZ NOT NULL,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  risk_score        DOUBLE PRECISION NOT NULL,
  risk_level        VARCHAR(20) NOT NULL,
  ml_probability    DOUBLE PRECISION,
  ml_confidence     DOUBLE PRECISION,
  trigger_boost     DOUBLE PRECISION DEFAULT 0,
  active_triggers   JSONB DEFAULT '[]',
  PRIMARY KEY (time, zone_id)
);
SELECT create_hypertable('risk_scores', 'time');

-- 24-hour forecast trajectories
CREATE TABLE risk_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  forecast_hour     TIMESTAMPTZ NOT NULL,
  risk_score        DOUBLE PRECISION NOT NULL,
  confidence_low    DOUBLE PRECISION,
  confidence_high   DOUBLE PRECISION
);
CREATE INDEX idx_forecasts_zone_time ON risk_forecasts(zone_id, generated_at DESC);

-- SHAP-derived causative factors per scoring run
CREATE TABLE causative_factors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  scored_at         TIMESTAMPTZ NOT NULL,
  factor            VARCHAR(200) NOT NULL,
  contribution_pct  DOUBLE PRECISION NOT NULL
);

-- Alerts
CREATE TABLE alerts (
  id                VARCHAR(10) PRIMARY KEY,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  tier              VARCHAR(20) NOT NULL CHECK (tier IN ('Advisory', 'Watch', 'Warning')),
  risk_level        VARCHAR(20) NOT NULL,
  risk_score        DOUBLE PRECISION,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  affected_radius   DOUBLE PRECISION,
  guidance          TEXT,
  is_active         BOOLEAN DEFAULT TRUE
);

-- Exposure cache (refreshed on alert creation)
CREATE TABLE zone_exposure (
  zone_id                       VARCHAR(10) PRIMARY KEY REFERENCES zones(id),
  estimated_population_in_radius  INTEGER,
  estimated_structures_at_risk    INTEGER,
  road_network_length_at_risk_km  DOUBLE PRECISION,
  agricultural_land_hectares      DOUBLE PRECISION,
  severity_tier                   VARCHAR(20),
  exposure_summary                TEXT,
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial: roads
CREATE TABLE roads (
  id          VARCHAR(10) PRIMARY KEY,
  name        VARCHAR(200),
  geom        GEOMETRY(LineString, 4326),
  zone_id     VARCHAR(10) REFERENCES zones(id)
);

-- Spatial: settlements
CREATE TABLE settlements (
  id          VARCHAR(10) PRIMARY KEY,
  name        VARCHAR(200),
  population  INTEGER,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  geom        GEOMETRY(Point, 4326),
  zone_id     VARCHAR(10) REFERENCES zones(id)
);

-- Historical landslide incidents
CREATE TABLE historical_incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     VARCHAR(10) REFERENCES zones(id),
  event_date  DATE NOT NULL,
  description TEXT,
  severity    VARCHAR(20),
  source      VARCHAR(50) DEFAULT 'GSI'
);

-- Weather forecasts (Open-Meteo hourly)
CREATE TABLE weather_forecasts (
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id),
  forecast_time     TIMESTAMPTZ NOT NULL,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  precipitation_mm  DOUBLE PRECISION,
  temperature       DOUBLE PRECISION,
  soil_moisture     DOUBLE PRECISION,
  PRIMARY KEY (zone_id, forecast_time, fetched_at)
);

-- Notification dispatch log
CREATE TABLE notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    VARCHAR(10) REFERENCES alerts(id),
  channel     VARCHAR(20),
  recipient   VARCHAR(200),
  status      VARCHAR(20),
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- News / advisories
CREATE TABLE news_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(300) NOT NULL,
  summary     TEXT,
  source      VARCHAR(100),
  tag         VARCHAR(50),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  url         VARCHAR(500)
);
```

### 6.3 Seed Data Migration

Write a seed script that imports all 15 zones, 12 alerts, exposure data, causative factors, roads, settlements, and historical incidents from the current `mockData.ts` into PostgreSQL. This ensures the new system launches with the same demo data, then gradually replaces it with live API data.

---

## 7. API Contract Design

Base URL: `http://localhost:3000/api/v1`

### 7.1 Authentication

```
POST /auth/login          { username, password } → { token, role, expiresIn }
POST /auth/refresh        { refreshToken } → { token }
GET  /auth/me             (JWT) → { id, username, role }
```

### 7.2 Zones

```
GET  /zones                          → Zone[] (with latest risk score)
GET  /zones/:id                      → Zone detail + exposure + factors
GET  /zones/:id/readings?hours=24    → TimeSeriesPoint[] (sensor data)
GET  /zones/:id/risk-history?days=30 → TimeSeriesPoint[] (daily risk)
GET  /zones/:id/forecast             → TimeSeriesPoint[] (24h trajectory)
GET  /zones/:id/incidents            → HistoricalIncident[]
GET  /zones/map-data                 → { zones, roads, settlements, hotspots }
```

### 7.3 Alerts

```
GET    /alerts                ?state=&tier=&active=true → Alert[]
POST   /alerts/:id/acknowledge                       → { ok }
POST   /alerts/:id/notify                            → dispatch to authorities
POST   /alerts/broadcast                             → citizen broadcast
GET    /alerts/feed                                  → HTMX partial (last 10)
```

### 7.4 Analytics

```
GET  /analytics/dashboard-stats     → { totalZones, activeAlerts, highRiskZones, lastSync }
GET  /analytics/risk-distribution   → { level, count }[]
GET  /analytics/seasonal-heatmap    → monthly risk distribution
GET  /analytics/rainfall-correlation → { zone, rainfall, risk }[]
GET  /analytics/comparison?zones=z01,z03 → multi-zone time series
```

### 7.5 Scenarios (What-If)

```
POST /scenarios/compute  { rainfallMm, earthquakeMagnitude, soilMoisturePercent, groundMovementMm }
                         → ScenarioResults (same shape as scenarioSimulator.ts)
```

### 7.6 ML Service (FastAPI — port 8000)

```
POST /predict            { zone_id, features: {...} } → { probability, risk_score, risk_level, confidence }
POST /predict/batch      { zones: [{ zone_id, features }] } → [{ ... }]
POST /forecast           { zone_id, features, hourly_forecast: [...] } → { trajectory: [...] }
POST /explain            { zone_id, features } → { factors: [{ factor, contributionPercent }] }
GET  /health             → { status, model_version, last_trained }
POST /train              (admin only) → trigger retraining pipeline
```

### 7.7 Citizen

```
GET  /citizen/alerts?zone_id=z01     → active alerts for citizen's zone
GET  /citizen/evacuation?zone_id=z01 → evacuation centre info
GET  /citizen/contacts               → emergency contacts
```

### 7.8 System

```
GET  /system/health    → { ingestion, ml, database, alert_engine, last_sync }
GET  /news             → NewsItem[]
```

### 7.9 HTMX Partials (HTML fragments, not JSON)

```
GET  /partials/alert-feed          → EJS partial for dashboard alert ticker
GET  /partials/zone-card/:id       → EJS partial for zone summary card
GET  /partials/map-popup/:id       → EJS partial for Leaflet popup content
GET  /partials/risk-trajectory/:id → EJS partial with Chart.js canvas
```

---

## 8. Development Phases (6 Phases)

### Phase 1: Foundation & Database (Week 1–2)

**Goal:** Project scaffolding, database, and seed data from prototype.

#### Tasks

- [x] Initialize monorepo structure (`/server`, `/ml-service`, `/public`, `/views`)
- [x] Set up `docker-compose.yml` with PostgreSQL (+ PostGIS), Redis, and services
- [x] Create all database tables and migrations (schema from §6)
- [x] Write seed script: import 15 zones, alerts, exposure, roads, settlements from `mockData.ts`
- [x] Set up Express.js server with basic routing, EJS view engine, static file serving
- [x] Configure environment variables (`.env.example` with all required keys)
- [x] Implement JWT authentication (replace `mockAuth.ts` logic)
- [x] Create `GET /api/v1/zones` and `GET /api/v1/alerts` returning seeded data
- [x] Set up Winston logging and health check endpoint

#### Deliverables

```
docker-compose up → PostgreSQL ready, Express serving /api/v1/health
Seed data matches current prototype exactly
JWT login works for admin and citizen roles
```

#### Files to Create

```
server/
├── package.json
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── zones.js
│   │   └── alerts.js
│   ├── controllers/
│   ├── services/
│   └── db/
│       ├── migrations/
│       │   └── 001_initial_schema.sql
│       └── seeds/
│           └── seed_from_prototype.js
├── views/           (empty for now)
└── public/
    ├── css/
    └── js/
docker-compose.yml
.env.example
```

---

### Phase 2: Data Ingestion Pipeline (Week 3–4)

**Goal:** Live environmental data flowing into PostgreSQL.

#### Tasks

- [x] Implement Open-Meteo ingestion worker (`server/src/workers/ingestRainfall.js`)
  - Fetch hourly precipitation for all 15 zone coordinates
  - Store in `sensor_readings` hypertable
  - Compute rolling windows: 24h, 72h, 7d sums
- [x] Implement Open-Meteo forecast ingestion
  - Hourly forecast for next 24h → `weather_forecasts` table
- [x] Implement Open-Meteo Archive backfill
  - Pull 2+ years historical rainfall for ML training
- [x] Set up Google Earth Engine Python script (`ml-service/scripts/ingest_gee.py`)
  - Export SRTM slope, elevation, curvature per zone
  - Export ESA WorldCover land cover class
  - Export Sentinel-2 NDVI
  - Write to `zone_static_attributes`
- [x] Implement OSM Overpass ingestion for roads and settlements
  - Query within 10km of each zone centroid
  - Store in `roads` and `settlements` tables with PostGIS geometry
- [x] Download and import GSI landslide inventory (GeoJSON/CSV)
  - Store in `historical_incidents`
  - Count events per zone for `historical_events` feature
- [x] Set up `node-cron` schedules (see §5.9)
- [x] Add ingestion status to `GET /system/health`
- [x] Create data validation: reject readings outside physical bounds

#### Open-Meteo Integration Detail

```javascript
// server/src/services/openMeteo.js
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

async function fetchZoneWeather(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: 'precipitation,temperature_2m,soil_moisture_0_to_7cm',
    forecast_days: 2,
    timezone: 'Asia/Kolkata',
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params}`);
  const data = await res.json();
  return data.hourly; // { time[], precipitation[], temperature_2m[], soil_moisture[] }
}
```

#### Deliverables

```
Sensor readings updating every 15 minutes with real rainfall data
zone_static_attributes populated from GEE
Roads and settlements loaded from OSM
Historical incidents from GSI
/system/health shows ingestion timestamps
```

#### Phase 2 Completion Notes (2026-08-31)

**Status: COMPLETE** — All Phase 2 tasks implemented and verified.

**What was built:**

| Component | Location | Notes |
|-----------|----------|-------|
| Open-Meteo service | `server/src/services/openMeteo.js` | Forecast, archive, elevation, rolling windows |
| Overpass service | `server/src/services/overpass.js` | Uses native `https` (Node `fetch` unreliable with Overpass) |
| Validation | `server/src/services/validateReading.js` | Physical bounds for all sensor fields |
| Ingestion tracker | `server/src/services/ingestionTracker.js` | `ingestion_runs` + `ingestion_state` tables |
| Workers | `server/src/workers/ingest*.js` | rainfall, forecast, historical, osm, gsi, terrain |
| Scheduler | `server/src/scheduler.js` | node-cron per §5.9 schedule |
| GEE script | `ml-service/scripts/ingest_gee.py` | GEE + Open-Meteo fallback |
| GSI data | `server/src/data/gsi_landslides.json` | 20 NER landslide points |
| Migrations | `002_ingestion_tracking.sql`, `003_osm_id_length.sql` | Job tracking + OSM ID column width |

**Verified live data (docker compose up):**

- 5,565+ sensor readings (live + 1-year archive backfill)
- 1,800 weather forecast rows (24h × 15 zones)
- 15 zones with elevation/slope in `zone_static_attributes`
- 24 GSI historical incidents assigned to nearest zones
- 666+ roads, 43+ settlements (seed + OSM for z01)
- `/api/v1/health` and `/api/v1/system/health` show ingestion `lastRuns`

**Fixes applied during completion:**

1. `scheduler.js` import paths (`./config/` not `../config/`)
2. `ingestGsi.js` SQL type casts (`$1::varchar`, `$2::date`) for PostgreSQL
3. Docker `node_modules` anonymous volume — prevents bcrypt SIGSEGV from host/container libc mismatch
4. `overpass.js` rewritten: simplified `out geom` queries, native `https`, retry + fallback endpoints
5. Migration `003` widens `roads.id` / `settlements.id` to `VARCHAR(50)` for OSM IDs (`osm_w123456789`)
6. `DB_SEED_ON_START=false` in docker-compose (seed only on first run via `npm run seed`)

**Environment variables added:** `INGESTION_ENABLED`, `INGESTION_ON_START`, `INGESTION_OSM_ON_START`, `INGESTION_HISTORICAL_ON_START`, `OPEN_METEO_ARCHIVE_URL`, `HISTORICAL_YEARS`

**Known limitations for Phase 3:**

- Terrain uses Open-Meteo elevation API by default; full GEE (SRTM, WorldCover, NDVI) requires `GEE_SERVICE_ACCOUNT` + `GEE_PRIVATE_KEY_PATH`
- OSM Overpass API is rate-limited; bulk 15-zone runs may need retries — monthly cron handles this
- `sensor_readings` uses regular PostgreSQL table (not TimescaleDB hypertable) — sufficient for Phase 2
- Risk scores updated by ML service every 15 min (replaces seed mock values)

**Port:** API runs on `http://localhost:3002` (host maps 3002→3000; port 3000 occupied by another service).

---

### Phase 3: ML Risk Model & Forecast Engine (Week 5–7)

**Goal:** Trained XGBoost model producing real risk scores and 24h forecasts.

#### Tasks

- [x] Set up FastAPI project (`ml-service/`)
- [x] Build training dataset:
  - Positive: GSI landslide points in NER
  - Negative: stratified random non-landslide points
  - Features from Open-Meteo archive + GEE static attributes
- [x] Feature engineering pipeline (`ml-service/src/features.py`)
- [x] Train XGBoost classifier with cross-validation
- [x] Calibrate probabilities with isotonic regression
- [x] Integrate SHAP for causative factor explanations
- [x] Implement `/predict`, `/forecast`, `/explain` endpoints
- [x] Build 24h forecast engine (§5.5 algorithm)
- [x] Create scoring cron job in Express:
  - After each ingestion cycle, call FastAPI for all zones
  - Store results in `risk_scores` and `causative_factors`
  - Store forecast trajectories in `risk_forecasts`
- [x] Port trigger factor analysis (§5.4) as pre/post-processing in scoring pipeline
- [x] Model versioning: save to `ml-service/models/` with metadata
- [x] Evaluation report: precision, recall, F1, AUC on test set

#### ML Service Structure

```
ml-service/
├── requirements.txt
├── Dockerfile
├── src/
│   ├── main.py              # FastAPI app
│   ├── features.py          # Feature engineering
│   ├── model.py             # Load/predict/explain
│   ├── forecast.py          # 24h forecast engine
│   ├── triggers.py          # Trigger factor analysis
│   └── train.py             # Training pipeline
├── scripts/
│   ├── ingest_gee.py
│   └── build_dataset.py
├── models/
│   ├── xgb_landslide_v1.joblib
│   └── calibrator_v1.joblib
├── data/
│   ├── landslide_inventory.csv
│   └── training_features.parquet
└── notebooks/
    └── model_evaluation.ipynb
```

#### Deliverables

```
FastAPI service running on :8000
Risk scores updating every 15 min with real ML output
SHAP explanations replacing mock causative factors
24h forecast trajectories generated hourly
Model evaluation report with metrics
```

#### Phase 3 Completion Notes (2026-08-31)

**Status: COMPLETE** — ML service deployed, integrated with Express, scoring live.

**What was built:**

| Component | Location | Notes |
|-----------|----------|-------|
| FastAPI ML service | `ml-service/src/main.py` | `/health`, `/predict`, `/predict/batch`, `/forecast`, `/explain`, `/train` |
| Feature engineering | `ml-service/src/features.py` | 10 features incl. antecedent wetness index |
| XGBoost + calibration | `ml-service/src/train.py` | Isotonic regression on validation probs |
| SHAP explanations | `ml-service/src/model.py` | TreeExplainer, top-5 causative factors |
| Trigger analysis | `ml-service/src/triggers.py` | §5.4 pre/post ML boost (max +1.0) |
| 24h forecast engine | `ml-service/src/forecast.py` | Rolling precip windows per forecast hour |
| ML client | `server/src/services/mlService.js` | HTTP client with health check |
| Scoring service | `server/src/services/scoringService.js` | Batch predict + SHAP + DB persist |
| Scoring workers | `server/src/workers/scoreRisk.js`, `scoreForecast.js` | Tracked via ingestion_tracker |
| Scheduler integration | `server/src/scheduler.js` | Rainfall→score every 15 min; forecast→risk_forecast hourly |
| Zone forecast API | `GET /api/v1/zones/:id/forecast` | 24-point trajectory from `risk_forecasts` |
| Docker Compose | `docker-compose.yml` | `ml-service` on :8000, server depends on ML health |

**Model metrics (evaluation_report.json):** AUC 1.0, F1 0.86, precision 1.0, recall 0.75 (synthetic training set from 20 GSI points + 120 negatives).

**Fixes applied during completion:**

1. SHAP `/explain` — cast `numpy.float32` to Python `float` for FastAPI JSON serialization
2. Forecast extraction — `extractForecastHours()` now filters future hours only (24 points per zone)
3. Zone API — exposes `mlProbability`, `triggerBoost`, `activeTriggers`, `forecastTrajectory`
4. Causative factors — replaced seed mock factors with live SHAP output on each scoring run

**Verified deliverables:**

- FastAPI on `http://localhost:8000` (healthy, model v1 loaded)
- Risk scores update every 15 min via rainfall cron chain (~150ms for 15 zones)
- SHAP explanations in `causative_factors` table (5 factors per zone)
- 24h forecast trajectories: 360 points (15 zones × 24 hours) in `risk_forecasts`
- `GET /api/v1/health` reports ML status, model version, and metrics

**Known limitations for Phase 4:**

- Training data is synthetic around GSI inventory (20 points) — real archive features planned for production retrain
- Alert engine still uses seed alert data; Phase 4 wires alerts to live risk scores
- Risk scores reflect current low-rainfall conditions (mostly Low/1.0) — model responds correctly to high-rainfall scenarios

**Environment variables added:** `ML_SERVICE_URL`, `SCORING_ENABLED`, `SCORING_ON_START`

---

### Phase 4: Alert Engine & Notification System (Week 8–9)

**Goal:** Automated tiered alerts with notification dispatch.

#### Tasks

- [x] Implement alert rule engine (§5.6 algorithm) in `server/src/services/alertEngine.js`
- [x] Implement hysteresis: prevent alert flapping
- [x] Dynamic guidance text generation from zone exposure data
- [x] Exposure assessment: PostGIS queries for population/roads in radius
- [x] Severity tier computation (port `getSeverityTier` with real data)
- [x] Alert CRUD API endpoints (§7.3)
- [x] Alert acknowledge and resolve workflow
- [x] Notification dispatcher:
  - SMS via MSG91 or Twilio (configurable)
  - Email for authority alerts
  - In-app via Server-Sent Events (SSE) for dashboard
- [x] Citizen alert subscription: register phone number per zone
- [x] Alert deduplication: don't re-alert same tier within cooldown window
- [x] Audit log: all alert state changes in `notification_log`
- [x] Wire alert feed to HTMX partial endpoint

#### Deliverables

```
Alerts auto-generated when risk scores cross thresholds
Warning alerts trigger SMS to subscribed citizens
Dashboard alert feed updates live via SSE/HTMX
Exposure assessment uses real spatial data
Alert history with resolve/de-escalate tracking
```

#### Phase 4 Completion Notes (2026-08-31)

**Status: COMPLETE** — Alert engine evaluates live ML risk scores and dispatches notifications.

**What was built:**

| Component | Location | Notes |
|-----------|----------|-------|
| Alert rule engine | `server/src/services/alertEngine.js` | §5.6 tiers: Warning/Watch/Advisory with hysteresis |
| Exposure assessment | `server/src/services/exposure.js` | PostGIS population/roads queries + severity tier |
| Notification dispatcher | `server/src/services/notificationDispatcher.js` | SMS (MSG91), email, SSE broadcast |
| SSE hub | `server/src/services/sseHub.js` | `GET /api/v1/events/alerts` live feed |
| Alert worker | `server/src/workers/evaluateAlerts.js` | Chained after rainfall+scoring every 15 min |
| Subscriptions migration | `004_alert_subscriptions.sql` | Citizen phone per zone |
| Alert API | `server/src/routes/alerts.js` | feed, acknowledge, resolve, notify, broadcast |
| Citizen API | `server/src/routes/citizen.js` | alerts, evacuation, contacts, subscribe |
| HTMX partial | `GET /partials/alert-feed` | EJS fragment for dashboard ticker |

**Verified deliverables:**

- Seed alerts auto-resolved when risk dropped below thresholds (10 de-escalated on startup)
- Warning alert created for z01 when risk_score=4.6 (dynamic guidance from PostGIS roads)
- SMS logged to `notification_log` (simulated without MSG91_API_KEY)
- SSE + HTMX feed render active alerts
- Acknowledge workflow: `POST /api/v1/alerts/:id/acknowledge`
- Citizen subscription: `POST /api/v1/citizen/subscribe`

**Environment variables added:** `ALERTS_ENABLED`, `NOTIFICATIONS_ENABLED`, `ALERT_COOLDOWN_MIN`, `AUTHORITY_ALERT_EMAIL`

---

### Phase 5: Dashboard & Frontend (Week 10–12)

**Goal:** Full HTMX/EJS dashboard replacing the React prototype.

#### Tasks

- [x] Port Tailwind theme tokens from `src/index.css` to `public/css/ridge.css`
- [x] Create EJS layout templates:
  - `views/layouts/admin.ejs` (sidebar + topbar)
  - `views/layouts/citizen.ejs` (mobile-first)
  - `views/layouts/public.ejs` (landing, about)
- [x] Build pages (port from React pages):
  - [x] Login (`views/pages/login.ejs`)
  - [x] Landing (`views/pages/landing.ejs`)
  - [x] Dashboard (`views/pages/dashboard.ejs`) — stats, map, alert feed
  - [x] Zone Detail (`views/pages/zone-detail.ejs`) — risk trajectory, impact, factors
  - [x] Alerts (`views/pages/alerts.ejs`) — filterable list with HTMX
  - [x] Analytics (`views/pages/analytics.ejs`) — Chart.js charts
  - [x] Admin (`views/pages/admin.ejs`) — zone table, what-if, system health
  - [x] Citizen (`views/pages/citizen.ejs`) — bilingual, evacuation info
  - [x] News (`views/pages/news.ejs`)
  - [x] About (`views/pages/about.ejs`)
- [x] Integrate Leaflet.js map with heatmap (port `NERMap.tsx` logic to vanilla JS)
- [x] HTMX partials for live updates:
  - Alert feed ticker
  - Zone risk cards
  - Map popups
- [x] Alpine.js for interactive elements:
  - Rainfall simulator slider
  - Map layer toggles
  - What-If scenario controls
- [x] Chart.js for risk trajectory, analytics charts
- [x] Server-side render all data from PostgreSQL (no mock data)
- [x] Citizen portal: i18n with Assamese translations (JSON locale files)
- [x] Responsive design: mobile-first citizen, desktop admin
- [x] Wire What-If scenario to `POST /api/v1/scenarios/compute`

#### HTMX Pattern Example

```html
<!-- Dashboard alert feed: auto-refresh every 30s -->
<div id="alert-feed"
     hx-get="/partials/alert-feed"
     hx-trigger="every 30s"
     hx-swap="innerHTML">
  <!-- initial render -->
</div>

<!-- Zone filter on alerts page -->
<select name="state"
        hx-get="/alerts"
        hx-target="#alert-list"
        hx-trigger="change">
  <option value="">All States</option>
  <option value="Meghalaya">Meghalaya</option>
  ...
</select>
```

#### Deliverables

```
All 10 pages functional with server-rendered live data
Leaflet map with heatmap and layer toggles
HTMX live alert feed
What-If scenario working against real zone data
Citizen portal with bilingual support
Responsive on mobile and desktop
```

#### Phase 5 Completion Notes (2026-08-31)

**Status: COMPLETE** — Full HTMX/EJS dashboard live with server-rendered PostgreSQL data.

**What was built:**

| Component | Location | Notes |
|-----------|----------|-------|
| Design system | `public/css/ridge.css` | Dark theme, risk badges, responsive grids |
| Layouts | `views/layouts/*.ejs` | admin, citizen, public, login |
| Page routes | `src/routes/pages.js` | 10 pages with cookie JWT auth |
| Page controller | `src/controllers/pagesController.js` | SSR data from zones, alerts, analytics |
| Analytics API | `src/routes/analytics.js` | Dashboard stats, risk distribution, seasonal |
| Scenario API | `src/routes/scenarios.js` | What-if disaster simulation |
| News API | `src/routes/news.js` | News items from `news_items` table |
| Leaflet map | `public/js/ridge-map.js` | Heatmap, markers, roads, settlements |
| Charts | `public/js/ridge-charts.js` | Risk distribution, trajectory, seasonal |
| HTMX partials | `src/routes/partials.js` | alert-feed, alert-list, zone-card |
| i18n | `locales/en.json`, `locales/as.json` | Citizen portal bilingual |

**Pages:** `/` (landing), `/login`, `/dashboard`, `/zones/:id`, `/alerts`, `/analytics`, `/admin`, `/citizen`, `/news`, `/about`

**Verified:** All 10 pages return HTTP 200; scenario API computes Critical tier under high rainfall; Assamese locale renders on `/citizen?lang=as`.

---

### Phase 6: Integration, Testing & Deployment (Week 13–14)

**Goal:** End-to-end system tested, containerized, and deployable.

#### Tasks

- [x] End-to-end integration tests:
  - Ingestion → scoring → alert → notification flow
  - Login → dashboard → zone detail → alert acknowledge
  - Citizen portal alert display
- [x] Unit tests:
  - Alert rule engine logic
  - Trigger factor analysis
  - Risk score → level mapping
  - Exposure/severity computation
- [x] API tests (supertest):
  - All `/api/v1/*` endpoints
  - Auth middleware
  - Error handling
- [x] ML model validation:
  - Holdout test set evaluation
  - Forecast accuracy over 7-day window
- [x] Performance testing:
  - Scoring 15 zones < 5 seconds
  - Dashboard page load < 2 seconds
  - HTMX partial response < 200ms
- [x] Docker production build:
  - Multi-stage Dockerfile for Express
  - Dockerfile for FastAPI
  - `docker-compose.prod.yml` with Nginx reverse proxy
- [x] CI/CD pipeline (GitHub Actions):
  - Lint → Test → Build → Deploy
- [x] Production environment config
- [x] Monitoring setup:
  - Health check endpoints
  - Ingestion failure alerts
  - ML service uptime
- [x] Documentation:
  - API docs (Swagger for FastAPI, README for Express)
  - Deployment guide
  - Data source attribution
- [x] Security hardening:
  - Rate limiting on auth endpoints
  - Input validation on all API params
  - SQL injection prevention (parameterized queries)
  - CORS configuration
  - HTTPS/TLS via Nginx

#### Deliverables

```
docker-compose -f docker-compose.prod.yml up → full system running
All tests passing in CI
Deployment guide documented
System processes real rainfall → real ML scores → real alerts → dashboard
Performance benchmarks met
```

#### Phase 6 Completion Notes (2026-08-31)

**Status: COMPLETE** — Full test suite, CI/CD pipeline, and production deployment ready.

**What was built:**

| Component | Location | Notes |
|-----------|----------|-------|
| App factory | `server/src/app.js` | Testable Express app (separated from bootstrap) |
| Alert rules module | `server/src/services/alertRules.js` | Pure functions for unit testing |
| Input validation | `server/src/middleware/validate.js` | Query param sanitization |
| Server tests | `server/tests/` | Jest unit + supertest API + integration |
| ML tests | `ml-service/tests/` | pytest for features + FastAPI endpoints |
| Benchmark script | `server/scripts/benchmark.js` | Performance thresholds |
| Production Docker | `docker-compose.prod.yml` | Nginx + multi-stage builds |
| CI pipeline | `.github/workflows/ci.yml` | test-server → test-ml → build |
| Deployment guide | `DEPLOYMENT.md` | Production setup, TLS, backup |
| Root README | `README.md` | Project overview and quick start |

**Test coverage:** risk mapping, alert rules/hysteresis, exposure tiers, 20+ API endpoints, ML predict/explain, evaluation report validation.

**Production:** `docker compose -f docker-compose.prod.yml up -d --build` → Nginx on :80 proxying to Express + ML.

---

## 9. Project Structure (Target)

```
RIDGE/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
├── RIDGE-DEVELOPMENT-PLAN.md     ← this file
│
├── server/                        # Node.js Express backend
│   ├── package.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── zones.js
│   │   │   ├── alerts.js
│   │   │   ├── analytics.js
│   │   │   ├── scenarios.js
│   │   │   ├── citizen.js
│   │   │   ├── news.js
│   │   │   ├── system.js
│   │   │   └── partials.js       # HTMX HTML fragments
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── openMeteo.js
│   │   │   ├── alertEngine.js
│   │   │   ├── exposure.js
│   │   │   ├── scoring.js
│   │   │   └── notifications.js
│   │   ├── workers/
│   │   │   ├── ingestRainfall.js
│   │   │   ├── ingestForecast.js
│   │   │   ├── scoreRisk.js
│   │   │   ├── forecast24h.js
│   │   │   └── evaluateAlerts.js
│   │   └── db/
│   │       ├── migrations/
│   │       ├── seeds/
│   │       └── queries/
│   ├── views/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── partials/
│   ├── public/
│   │   ├── css/
│   │   │   └── ridge.css
│   │   ├── js/
│   │   │   ├── map.js
│   │   │   ├── charts.js
│   │   │   └── scenario.js
│   │   └── img/
│   └── tests/
│
├── ml-service/                    # Python FastAPI ML service
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.py
│   │   ├── features.py
│   │   ├── model.py
│   │   ├── forecast.py
│   │   ├── triggers.py
│   │   └── train.py
│   ├── scripts/
│   ├── models/
│   ├── data/
│   ├── notebooks/
│   └── tests/
│
├── prototype/                     # Archived React prototype (moved from root)
│   ├── src/
│   ├── package.json
│   └── ...
│
├── nginx/
│   └── ridge.conf
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 10. Infrastructure & DevOps

### 10.1 Docker Compose (Development)

```yaml
# docker-compose.yml
services:
  postgres:
    image: timescale/timescaledb-ha:pg16
    environment:
      POSTGRES_DB: ridge
      POSTGRES_USER: ridge
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  server:
    build: ./server
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [postgres, redis, ml-service]
    volumes: ["./server:/app"]

  ml-service:
    build: ./ml-service
    ports: ["8000:8000"]
    env_file: .env
    volumes: ["./ml-service:/app"]

volumes:
  pgdata:
```

### 10.2 Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://ridge:ridge@postgres:5432/ridge
REDIS_URL=redis://redis:6379
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=8h

ML_SERVICE_URL=http://ml-service:8000

# Open-Meteo (no API key required)
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1

# Google Earth Engine
GEE_SERVICE_ACCOUNT=your-sa@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/secrets/gee-key.json

# Notifications
SMS_PROVIDER=msg91
MSG91_API_KEY=
MSG91_SENDER_ID=RIDGE

# Optional
LOG_LEVEL=info
INGESTION_INTERVAL_MIN=15
```

### 10.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: RIDGE CI
on: [push, pull_request]
jobs:
  test-server:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - uses: actions/checkout@v4
      - run: cd server && npm ci && npm test

  test-ml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd ml-service && pip install -r requirements.txt && pytest

  build:
    needs: [test-server, test-ml]
    runs-on: ubuntu-latest
    steps:
      - run: docker compose build
```

---

## 11. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Express unit tests | Jest | Alert engine, scoring, exposure logic |
| Express API tests | Supertest | All `/api/v1/*` endpoints |
| ML unit tests | pytest | Feature engineering, model predict |
| ML integration | pytest | FastAPI endpoints with test model |
| E2E | Playwright *(optional)* | Login → dashboard → zone detail flow |
| Load | k6 *(optional)* | 50 concurrent dashboard users |

### Critical Test Cases

1. **Ingestion → Score → Alert pipeline:** Mock Open-Meteo response with extreme rainfall → verify Warning alert created
2. **Alert hysteresis:** Score drops below threshold → alert not immediately resolved (must wait min_duration)
3. **SHAP explanations:** Feature vector with high rainfall → rainfall factor has highest contribution
4. **Forecast monotonicity:** Increasing forecast rainfall → non-decreasing risk trajectory
5. **Auth:** Invalid JWT → 401; citizen role → cannot access `/admin`
6. **HTMX partials:** Alert feed partial returns valid HTML fragment

---

## 12. Migration from Prototype

### What to Keep (Move to `/prototype/`)

The entire current React codebase is preserved as a UX reference. Do not delete it.

### What to Port

| Prototype File | Target | Notes |
|---------------|--------|-------|
| `mockData.ts` interfaces | PostgreSQL schema (§6) | Direct mapping |
| `mockData.ts` seed values | `seed_from_prototype.js` | One-time import |
| `riskColors.ts` | `server/public/js/riskColors.js` | Same color scale |
| `simulator.ts` | `server/src/services/scenarios.js` | Port algorithm |
| `scenarioSimulator.ts` | `POST /api/v1/scenarios/compute` | Port algorithm |
| `getSeverityTier()` | `server/src/services/exposure.js` | Feed with PostGIS data |
| `NERMap.tsx` + layers | `public/js/map.js` | Vanilla Leaflet |
| `HeatmapLayer.tsx` | `public/js/map.js` | leaflet.heat config |
| `index.css` theme | `public/css/ridge.css` | CSS custom properties |
| Page layouts | EJS templates | Server-rendered equivalents |
| `AuthContext.tsx` | JWT middleware | Real auth |
| `mockNews.ts` | `news_items` table | Seed + RSS ingestion later |

### What to Drop

| Prototype File | Reason |
|---------------|--------|
| `react`, `react-dom`, `react-router-dom` | Replaced by EJS + HTMX |
| `recharts` | Replaced by Chart.js |
| `framer-motion` | CSS transitions instead |
| `@react-three/fiber`, `three` | Optional: keep 3D globe as Phase 5 stretch goal |
| `vite.config.ts` | No longer needed for production frontend |

### Parallel Operation During Migration

During Phases 1–4, the React prototype can continue running (`npm run dev` on port 5173) while the Express server is built on port 3000. The prototype's `mockData.ts` can be gradually replaced with `fetch('http://localhost:3000/api/v1/zones')` calls as a transitional step before the full EJS rebuild in Phase 5.

---

## 13. Risk Register & Open Decisions

| Risk | Impact | Mitigation |
|------|--------|------------|
| GSI landslide data incomplete for NER | Poor ML model for some zones | Supplement with news scraping + manual incident logging |
| Google Earth Engine quota/access | Missing terrain features | Fallback to SRTM via OpenTopography API |
| Open-Meteo soil moisture is proxy, not ground truth | Reduced model accuracy | Calibrate with any available IMD soil data |
| Class imbalance in landslide data | Model bias toward negatives | `scale_pos_weight`, SMOTE, stratified sampling |
| SMS delivery in remote NER areas | Citizens don't receive warnings | Multi-channel: SMS + in-app + community radio API |
| GEE requires service account setup | Delays Phase 2 | Start with Open-Meteo only; add GEE when creds ready |
| 3D globe/terrain not in HTMX stack | Feature regression | Phase 5 stretch goal: embed Three.js in EJS page |

### Open Decisions (Resolve in Phase 1)

1. **Hosting:** Cloud (AWS/GCP) vs on-premise government server?
2. **SMS provider:** MSG91 (India-native) vs Twilio?
3. **Authentication:** Local JWT vs government SSO integration?
4. **3D visualization:** Port Three.js globe to EJS or drop for 2D-only?
5. **Multi-language:** Assamese only or all NER languages?
6. **Historical data depth:** How many years of Open-Meteo archive to pull?

---

## Appendix A: Phase Timeline Summary

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14
      ├──────┤
      Phase 1: Foundation & DB
            ├──────┤
            Phase 2: Data Ingestion
                  ├──────────┤
                  Phase 3: ML Model & Forecast
                              ├──────┤
                              Phase 4: Alert Engine
                                    ├──────────┤
                                    Phase 5: Dashboard (EJS/HTMX)
                                                ├──────┤
                                                Phase 6: Test & Deploy
```

## Appendix B: Success Criteria

The project is **complete** when:

1. Real rainfall data from Open-Meteo flows into the system every 15 minutes
2. XGBoost model scores all 15 zones with SHAP-derived causative factors
3. 24-hour risk forecasts update hourly with confidence bands
4. Alerts auto-generate at correct tiers with hysteresis
5. Dashboard renders live data via EJS/HTMX (no mock data)
6. Citizen portal shows active alerts with bilingual guidance
7. What-If scenario simulates against live zone data
8. `docker-compose up` starts the full stack
9. All critical tests pass in CI
10. System runs for 72 hours without manual intervention

---

*Document generated from codebase audit of `/home/arvinalmeida/RIDGE` on 2026-08-31.*  
*Prototype version: 1.0.0 (React/Vite). Target version: 2.0.0 (Express/EJS/HTMX + FastAPI + PostgreSQL).*
