import bcrypt from 'bcrypt'
import { pool } from '../../config/database.js'
import logger from '../../config/logger.js'
import {
  zones,
  alerts,
  mockRoads,
  mapSettlements,
  zoneExposure,
  zoneCausativeFactors,
  historicalIncidents,
  newsItems,
  getSeverityTier,
  getExposureSummary,
} from './prototypeData.js'

const SEED_MARKER = 'prototype_v1'
const SEED_TIME = new Date('2026-08-31T15:00:00Z')

function wktLineString(points) {
  const coords = points.map((p) => `${p.lng} ${p.lat}`).join(', ')
  return `LINESTRING(${coords})`
}

export async function upsertNewsItems() {
  for (const n of newsItems) {
    await pool.query(
      `INSERT INTO news_items (external_id, title, summary, source, tag, state, zone_name, published_at, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (external_id) DO UPDATE SET
         title = EXCLUDED.title,
         summary = EXCLUDED.summary,
         source = EXCLUDED.source,
         tag = EXCLUDED.tag,
         state = EXCLUDED.state,
         zone_name = EXCLUDED.zone_name,
         published_at = EXCLUDED.published_at,
         url = EXCLUDED.url`,
      [n.id, n.headline, n.summary, n.source, n.tag, n.state ?? null, n.zone ?? null, n.timestamp, n.url ?? null],
    )
  }
}

export async function seedDatabase({ force = false } = {}) {
  await upsertNewsItems()

  const client = await pool.connect()
  try {
    const { rows: existing } = await client.query(
      'SELECT id FROM zones WHERE id = $1',
      ['z01'],
    )
    if (existing.length > 0 && !force) {
      logger.info('Seed data already present — skipping (use force=true to re-seed)')
      return
    }

    if (force) {
      logger.warn('Force re-seed: clearing existing data')
      await client.query(`
        TRUNCATE TABLE
          notification_log, alert_acknowledgments, causative_factors,
          risk_forecasts, risk_scores, sensor_readings, weather_forecasts,
          historical_incidents, alerts, zone_exposure, roads, settlements,
          zone_static_attributes, news_items, system_health, zones, users
        RESTART IDENTITY CASCADE
      `)
    }

    await client.query('BEGIN')

    // Users (admin/admin, user/user — matches prototype mockAuth)
    const adminHash = await bcrypt.hash('admin', 10)
    const userHash = await bcrypt.hash('user', 10)
    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES
        ('admin', $1, 'admin'),
        ('user', $2, 'citizen')
       ON CONFLICT (username) DO NOTHING`,
      [adminHash, userHash],
    )

    // Zones + static attributes + sensor readings + risk scores
    for (const z of zones) {
      await client.query(
        `INSERT INTO zones (id, name, state, lat, lng, geom, sensor_status)
         VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326), $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, state = EXCLUDED.state,
           lat = EXCLUDED.lat, lng = EXCLUDED.lng, geom = EXCLUDED.geom,
           sensor_status = EXCLUDED.sensor_status`,
        [z.id, z.name, z.state, z.lat, z.lng, z.sensorStatus],
      )

      await client.query(
        `INSERT INTO zone_static_attributes
           (zone_id, slope_angle, seismic_index, historical_events)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (zone_id) DO UPDATE SET
           slope_angle = EXCLUDED.slope_angle,
           seismic_index = EXCLUDED.seismic_index`,
        [z.id, z.slopeAngle, z.seismicIndex, 0],
      )

      const rainfall72h = Math.round(z.cumulativeRainfall * 0.65)
      await client.query(
        `INSERT INTO sensor_readings
           (time, zone_id, rainfall_1h, rainfall_24h, rainfall_72h, cumulative_7d, soil_saturation, ground_movement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (time, zone_id) DO NOTHING`,
        [
          SEED_TIME, z.id,
          Math.round(z.rainfall24h / 24),
          z.rainfall24h, rainfall72h, z.cumulativeRainfall,
          z.soilSaturation, z.groundMovement,
        ],
      )

      const mlProbability = (z.riskScore - 1) / 4
      await client.query(
        `INSERT INTO risk_scores
           (time, zone_id, risk_score, risk_level, ml_probability, ml_confidence)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (time, zone_id) DO NOTHING`,
        [SEED_TIME, z.id, z.riskScore, z.riskLevel, mlProbability, z.mlConfidence],
      )
    }

    // Alerts
    for (const a of alerts) {
      const zone = zones.find((z) => z.id === a.zoneId)
      await client.query(
        `INSERT INTO alerts
           (id, zone_id, tier, risk_level, risk_score, issued_at, affected_radius, guidance, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.zoneId, a.tier, a.riskLevel, zone?.riskScore ?? null, a.issuedAt, a.affectedRadius, a.guidance],
      )
    }

    // Zone exposure
    for (const z of zones) {
      const exp = zoneExposure[z.id]
      if (!exp) continue
      const severity = getSeverityTier(z.riskLevel, exp)
      const summary = getExposureSummary(z.id)
      await client.query(
        `INSERT INTO zone_exposure
           (zone_id, estimated_population_in_radius, estimated_structures_at_risk,
            road_network_length_at_risk_km, agricultural_land_hectares,
            severity_tier, exposure_summary, exposure_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (zone_id) DO UPDATE SET
           estimated_population_in_radius = EXCLUDED.estimated_population_in_radius,
           severity_tier = EXCLUDED.severity_tier,
           exposure_summary = EXCLUDED.exposure_summary,
           exposure_details = EXCLUDED.exposure_details`,
        [
          z.id, exp.estimatedPopulationInRadius, exp.estimatedStructuresAtRisk,
          exp.roadNetworkLengthAtRiskKm, exp.agriculturalLandHectares,
          severity, summary,
          JSON.stringify({ roads: exp.roads, settlements: exp.settlements, infrastructure: exp.infrastructure }),
        ],
      )
    }

    // Causative factors
    for (const z of zones) {
      const factors = zoneCausativeFactors[z.id] ?? []
      for (const f of factors) {
        await client.query(
          `INSERT INTO causative_factors (zone_id, scored_at, factor, contribution_pct)
           VALUES ($1, $2, $3, $4)`,
          [z.id, SEED_TIME, f.factor, f.contributionPercent],
        )
      }
    }

    // Roads
    for (const road of mockRoads) {
      await client.query(
        `INSERT INTO roads (id, name, geom, zone_id)
         VALUES ($1, $2, ST_GeomFromText($3, 4326), $4)
         ON CONFLICT (id) DO NOTHING`,
        [road.id, road.name, wktLineString(road.points), road.zoneId ?? null],
      )
    }

    // Settlements
    for (const s of mapSettlements) {
      await client.query(
        `INSERT INTO settlements (id, name, population, lat, lng, geom, zone_id)
         VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326), $6)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.population, s.lat, s.lng, s.zoneId],
      )
    }

    // Historical incidents
    for (const [zoneId, incidents] of Object.entries(historicalIncidents)) {
      for (const inc of incidents) {
        await client.query(
          `INSERT INTO historical_incidents (zone_id, event_date, description, severity, source)
           VALUES ($1, $2, $3, $4, 'GSI')`,
          [zoneId, inc.date, inc.event, inc.severity],
        )
      }
    }

    // News items (also synced on every startup via upsertNewsItems)
    for (const n of newsItems) {
      await client.query(
        `INSERT INTO news_items (external_id, title, summary, source, tag, state, zone_name, published_at, url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (external_id) DO NOTHING`,
        [n.id, n.headline, n.summary, n.source, n.tag, n.state ?? null, n.zone ?? null, n.timestamp, n.url ?? null],
      )
    }

    // System health defaults
    const components = [
      { component: 'database', status: 'operational', message: 'PostgreSQL connected' },
      { component: 'ingestion', status: 'pending', message: 'Awaiting Phase 2 Open-Meteo integration' },
      { component: 'ml_service', status: 'pending', message: 'Awaiting Phase 3 FastAPI service' },
      { component: 'alert_engine', status: 'operational', message: 'Seeded alerts active' },
      { component: 'redis', status: 'operational', message: 'Cache available' },
    ]
    for (const c of components) {
      await client.query(
        `INSERT INTO system_health (component, status, message)
         VALUES ($1, $2, $3)
         ON CONFLICT (component) DO UPDATE SET status = EXCLUDED.status, message = EXCLUDED.message, last_check = NOW()`,
        [c.component, c.status, c.message],
      )
    }

    await client.query('COMMIT')
    logger.info(`Seed complete (${SEED_MARKER}): ${zones.length} zones, ${alerts.length} alerts`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

import { pathToFileURL } from 'url'

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const force = process.argv.includes('--force')
  seedDatabase({ force })
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Seed failed', { error: err.message, stack: err.stack })
      process.exit(1)
    })
}
