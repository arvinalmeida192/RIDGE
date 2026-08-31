-- RIDGE Phase 1: Initial schema
-- PostgreSQL 16 + PostGIS

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) UNIQUE NOT NULL,
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'citizen', 'operator')),
  preferred_lang  VARCHAR(5) DEFAULT 'en',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring zones
CREATE TABLE zones (
  id              VARCHAR(10) PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  state           VARCHAR(50) NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  geom            GEOMETRY(Point, 4326),
  sensor_status   VARCHAR(20) DEFAULT 'Online',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_state ON zones(state);
CREATE INDEX idx_zones_geom ON zones USING GIST(geom);

-- Static terrain attributes (updated weekly from GEE in Phase 2)
CREATE TABLE zone_static_attributes (
  zone_id           VARCHAR(10) PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
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

-- Time-series sensor readings
CREATE TABLE sensor_readings (
  time              TIMESTAMPTZ NOT NULL,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  rainfall_1h       DOUBLE PRECISION,
  rainfall_24h      DOUBLE PRECISION,
  rainfall_72h      DOUBLE PRECISION,
  cumulative_7d     DOUBLE PRECISION,
  soil_saturation   DOUBLE PRECISION,
  ground_movement   DOUBLE PRECISION,
  temperature       DOUBLE PRECISION,
  PRIMARY KEY (time, zone_id)
);

CREATE INDEX idx_sensor_readings_zone_time ON sensor_readings(zone_id, time DESC);

-- Risk scores
CREATE TABLE risk_scores (
  time              TIMESTAMPTZ NOT NULL,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  risk_score        DOUBLE PRECISION NOT NULL,
  risk_level        VARCHAR(20) NOT NULL,
  ml_probability    DOUBLE PRECISION,
  ml_confidence     DOUBLE PRECISION,
  trigger_boost     DOUBLE PRECISION DEFAULT 0,
  active_triggers   JSONB DEFAULT '[]',
  PRIMARY KEY (time, zone_id)
);

CREATE INDEX idx_risk_scores_zone_time ON risk_scores(zone_id, time DESC);

-- 24-hour forecast trajectories
CREATE TABLE risk_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
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
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  scored_at         TIMESTAMPTZ NOT NULL,
  factor            VARCHAR(200) NOT NULL,
  contribution_pct  DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_causative_factors_zone ON causative_factors(zone_id, scored_at DESC);

-- Alerts
CREATE TABLE alerts (
  id                VARCHAR(10) PRIMARY KEY,
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  tier              VARCHAR(20) NOT NULL CHECK (tier IN ('Advisory', 'Watch', 'Warning')),
  risk_level        VARCHAR(20) NOT NULL,
  risk_score        DOUBLE PRECISION,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  affected_radius   DOUBLE PRECISION,
  guidance          TEXT,
  is_active         BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_alerts_zone ON alerts(zone_id);
CREATE INDEX idx_alerts_active ON alerts(is_active) WHERE is_active = TRUE;

-- Alert acknowledgments
CREATE TABLE alert_acknowledgments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    VARCHAR(10) NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (alert_id, user_id)
);

-- Exposure cache
CREATE TABLE zone_exposure (
  zone_id                         VARCHAR(10) PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
  estimated_population_in_radius  INTEGER,
  estimated_structures_at_risk      INTEGER,
  road_network_length_at_risk_km  DOUBLE PRECISION,
  agricultural_land_hectares        DOUBLE PRECISION,
  severity_tier                     VARCHAR(20),
  exposure_summary                  TEXT,
  exposure_details                  JSONB DEFAULT '{}',
  updated_at                        TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial: roads
CREATE TABLE roads (
  id          VARCHAR(10) PRIMARY KEY,
  name        VARCHAR(200),
  geom        GEOMETRY(LineString, 4326),
  zone_id     VARCHAR(10) REFERENCES zones(id) ON DELETE SET NULL
);

CREATE INDEX idx_roads_geom ON roads USING GIST(geom);

-- Spatial: settlements
CREATE TABLE settlements (
  id          VARCHAR(10) PRIMARY KEY,
  name        VARCHAR(200),
  population  INTEGER,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  geom        GEOMETRY(Point, 4326),
  zone_id     VARCHAR(10) REFERENCES zones(id) ON DELETE SET NULL
);

CREATE INDEX idx_settlements_geom ON settlements USING GIST(geom);

-- Historical landslide incidents
CREATE TABLE historical_incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     VARCHAR(10) REFERENCES zones(id) ON DELETE CASCADE,
  event_date  DATE NOT NULL,
  description TEXT,
  severity    VARCHAR(20),
  source      VARCHAR(50) DEFAULT 'GSI'
);

-- Weather forecasts (Open-Meteo hourly — Phase 2)
CREATE TABLE weather_forecasts (
  zone_id           VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
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
  alert_id    VARCHAR(10) REFERENCES alerts(id) ON DELETE SET NULL,
  channel     VARCHAR(20),
  recipient   VARCHAR(200),
  status      VARCHAR(20),
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- News / advisories
CREATE TABLE news_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   VARCHAR(10) UNIQUE,
  title         VARCHAR(300) NOT NULL,
  summary       TEXT,
  source        VARCHAR(100),
  tag           VARCHAR(50),
  state         VARCHAR(50),
  zone_name     VARCHAR(100),
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  url           VARCHAR(500)
);

-- System health / pipeline status
CREATE TABLE system_health (
  id          SERIAL PRIMARY KEY,
  component   VARCHAR(50) NOT NULL UNIQUE,
  status      VARCHAR(20) NOT NULL DEFAULT 'unknown',
  message     TEXT,
  last_check  TIMESTAMPTZ DEFAULT NOW()
);
