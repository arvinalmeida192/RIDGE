import { pool } from '../config/database.js'

function formatRelativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

export async function getAllZones({ state } = {}) {
  const params = []
  let where = 'WHERE z.is_active = true'
  if (state) {
    params.push(state)
    where += ` AND z.state = $${params.length}`
  }

  const { rows } = await pool.query(
    `SELECT
       z.id, z.name, z.state, z.lat, z.lng, z.sensor_status AS "sensorStatus",
       rs.risk_score AS "riskScore",
       rs.risk_level AS "riskLevel",
       rs.ml_probability AS "mlProbability",
       rs.ml_confidence AS "mlConfidence",
       rs.trigger_boost AS "triggerBoost",
       rs.active_triggers AS "activeTriggers",
       sr.rainfall_24h AS "rainfall24h",
       sr.cumulative_7d AS "cumulativeRainfall",
       sr.soil_saturation AS "soilSaturation",
       sr.ground_movement AS "groundMovement",
       zsa.slope_angle AS "slopeAngle",
       zsa.elevation_m AS "elevation",
       zsa.seismic_index AS "seismicIndex",
       rs.time AS "lastUpdatedAt"
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT * FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) rs ON true
     LEFT JOIN LATERAL (
       SELECT * FROM sensor_readings WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) sr ON true
     LEFT JOIN zone_static_attributes zsa ON zsa.zone_id = z.id
     ${where}
     ORDER BY rs.risk_score DESC NULLS LAST, z.name`,
    params,
  )

  return rows.map((z) => ({
    ...z,
    lastUpdated: z.lastUpdatedAt ? formatRelativeTime(z.lastUpdatedAt) : 'unknown',
  }))
}

export async function getMapData() {
  const zones = await getAllZones()
  const { rows: roads } = await pool.query(
    `SELECT id, name, zone_id AS "zoneId",
            ST_AsGeoJSON(geom)::json AS geometry
     FROM roads WHERE geom IS NOT NULL`,
  )
  const { rows: settlements } = await pool.query(
    `SELECT id, name, population, lat, lng, zone_id AS "zoneId" FROM settlements`,
  )
  const { rows: incidents } = await pool.query(
    `SELECT zone_id AS "zoneId", event_date AS date, description, severity
     FROM historical_incidents WHERE source = 'GSI'`,
  )

  return {
    zones,
    roads: roads.map((r) => ({
      id: r.id,
      name: r.name,
      zoneId: r.zoneId,
      coordinates: r.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [],
    })),
    settlements,
    hotspots: [...new Set(incidents.map((i) => i.zoneId))],
  }
}

export async function getZoneForecast(zoneId) {
  const { rows } = await pool.query(
    `SELECT forecast_hour AS time, risk_score AS value,
            confidence_low AS "confidenceLow", confidence_high AS "confidenceHigh",
            generated_at AS "generatedAt"
     FROM risk_forecasts
     WHERE zone_id = $1
       AND generated_at = (
         SELECT MAX(generated_at) FROM risk_forecasts WHERE zone_id = $1
       )
     ORDER BY forecast_hour`,
    [zoneId],
  )
  return rows
}

export async function getZoneById(id) {
  const zones = await getAllZones()
  const zone = zones.find((z) => z.id === id)
  if (!zone) return null

  const [exposure, factors, incidents] = await Promise.all([
    pool.query('SELECT * FROM zone_exposure WHERE zone_id = $1', [id]),
    pool.query(
      `SELECT factor, contribution_pct AS "contributionPercent"
       FROM causative_factors WHERE zone_id = $1
         AND scored_at = (SELECT MAX(scored_at) FROM causative_factors WHERE zone_id = $1)
       ORDER BY contribution_pct DESC`,
      [id],
    ),
    pool.query(
      `SELECT event_date AS date, description AS event, severity
       FROM historical_incidents WHERE zone_id = $1 ORDER BY event_date DESC`,
      [id],
    ),
  ])

  const exp = exposure.rows[0]
  const forecast = await getZoneForecast(id)
  return {
    ...zone,
    forecastTrajectory: forecast,
    exposure: exp
      ? {
          ...exp.exposure_details,
          estimatedPopulationInRadius: exp.estimated_population_in_radius,
          estimatedStructuresAtRisk: exp.estimated_structures_at_risk,
          roadNetworkLengthAtRiskKm: exp.road_network_length_at_risk_km,
          agriculturalLandHectares: exp.agricultural_land_hectares,
          severityTier: exp.severity_tier,
          exposureSummary: exp.exposure_summary,
        }
      : null,
    causativeFactors: factors.rows,
    historicalIncidents: incidents.rows,
  }
}
