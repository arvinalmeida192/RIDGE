import { pool } from '../config/database.js'
import logger from '../config/logger.js'
import { predictBatch, explainZone, forecastZone } from './mlService.js'
import { updateSystemHealth } from './ingestionTracker.js'

const RAINFALL_P90 = 180

async function getZonesForScoring() {
  const { rows } = await pool.query(
    `SELECT
       z.id,
       z.sensor_status AS "sensorStatus",
       sr.rainfall_1h AS "rainfall1h",
       sr.rainfall_24h AS "rainfall24h",
       sr.rainfall_72h AS "rainfall72h",
       sr.cumulative_7d AS "cumulative7d",
       sr.soil_saturation AS "soilSaturation",
       sr.ground_movement AS "groundMovement",
       sr.temperature,
       zsa.slope_angle AS "slopeAngle",
       zsa.elevation_m AS "elevation",
       zsa.seismic_index AS "seismicIndex",
       zsa.historical_events AS "historicalEvents"
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT * FROM sensor_readings WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) sr ON true
     LEFT JOIN zone_static_attributes zsa ON zsa.zone_id = z.id
     WHERE z.is_active = true
     ORDER BY z.id`,
  )

  return rows.map((row) => ({
    id: row.id,
    features: {
      rainfall_1h: row.rainfall1h ?? 0,
      rainfall_24h: row.rainfall24h ?? 0,
      rainfall_72h: row.rainfall72h ?? 0,
      cumulative_7d: row.cumulative7d ?? 0,
      soil_saturation: row.soilSaturation ?? 0,
      ground_movement: row.groundMovement,
      temperature: row.temperature,
      sensor_status: row.sensorStatus ?? 'Online',
      slope_angle: row.slopeAngle,
      elevation_m: row.elevation,
      historical_events: row.historicalEvents ?? 0,
      seismic_index: row.seismicIndex ?? 0.1,
    },
    static_attrs: {
      slope_angle: row.slopeAngle ?? 15,
      elevation_m: row.elevation ?? 500,
      seismic_index: row.seismicIndex ?? 0.1,
      historical_events: row.historicalEvents ?? 0,
      rainfall_p90: RAINFALL_P90,
    },
  }))
}

export async function scoreAllZones() {
  const zones = await getZonesForScoring()
  if (zones.length === 0) {
    logger.warn('No active zones for scoring')
    return { recordsProcessed: 0 }
  }

  const { results } = await predictBatch(zones)
  const scoredAt = new Date()
  let processed = 0

  for (const result of results) {
    await pool.query(
      `INSERT INTO risk_scores
         (time, zone_id, risk_score, risk_level, ml_probability, ml_confidence,
          trigger_boost, active_triggers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        scoredAt,
        result.zone_id,
        result.risk_score,
        result.risk_level,
        result.probability,
        result.confidence,
        result.trigger_boost,
        JSON.stringify(result.active_triggers ?? []),
      ],
    )

    try {
      const zone = zones.find((z) => z.id === result.zone_id)
      const { factors } = await explainZone(result.zone_id, zone.features)

      await pool.query(
        'DELETE FROM causative_factors WHERE zone_id = $1',
        [result.zone_id],
      )

      for (const factor of factors) {
        await pool.query(
          `INSERT INTO causative_factors (zone_id, scored_at, factor, contribution_pct)
           VALUES ($1, $2, $3, $4)`,
          [result.zone_id, scoredAt, factor.factor, factor.contributionPercent],
        )
      }
    } catch (err) {
      logger.warn(`SHAP explain failed for ${result.zone_id}`, { error: err.message })
    }

    processed++
  }

  await updateSystemHealth(
    'ml_scoring',
    'operational',
    `Scored ${processed} zones at ${scoredAt.toISOString()}`,
  )

  return { recordsProcessed: processed, metadata: { scoredAt: scoredAt.toISOString() } }
}

export async function forecastAllZones() {
  const zones = await getZonesForScoring()
  const generatedAt = new Date()
  let processed = 0

  for (const zone of zones) {
    const { rows: forecasts } = await pool.query(
      `SELECT DISTINCT ON (forecast_time)
         forecast_time, precipitation_mm, soil_moisture
       FROM weather_forecasts
       WHERE zone_id = $1 AND forecast_time > NOW()
       ORDER BY forecast_time, fetched_at DESC
       LIMIT 24`,
      [zone.id],
    )

    if (forecasts.length === 0) continue

    const hourlyForecast = forecasts.map((f) => ({
      time: f.forecast_time,
      precipitation_mm: f.precipitation_mm,
      soil_moisture: f.soil_moisture,
    }))

    const { trajectory } = await forecastZone(zone.id, zone.features, hourlyForecast)

    await pool.query(
      'DELETE FROM risk_forecasts WHERE zone_id = $1 AND generated_at < $2',
      [zone.id, generatedAt],
    )

    for (const point of trajectory) {
      await pool.query(
        `INSERT INTO risk_forecasts
           (zone_id, generated_at, forecast_hour, risk_score, confidence_low, confidence_high)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          zone.id,
          generatedAt,
          point.time,
          point.value,
          point.confidenceLow,
          point.confidenceHigh,
        ],
      )
      processed++
    }
  }

  await updateSystemHealth(
    'ml_forecast',
    'operational',
    `Generated ${processed} forecast points at ${generatedAt.toISOString()}`,
  )

  return { recordsProcessed: processed, metadata: { generatedAt: generatedAt.toISOString() } }
}

export default { scoreAllZones, forecastAllZones }
