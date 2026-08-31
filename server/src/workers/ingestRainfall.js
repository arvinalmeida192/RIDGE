import { pool } from '../config/database.js'
import {
  fetchAllZonesWeather,
  computeRollingWindows,
} from '../services/openMeteo.js'
import { validateSensorReading } from '../services/validateReading.js'
import { runJob } from '../services/ingestionTracker.js'
import logger from '../config/logger.js'

async function getActiveZones() {
  const { rows } = await pool.query(
    'SELECT id, name, lat, lng FROM zones WHERE is_active = true ORDER BY id',
  )
  return rows
}

export async function ingestRainfall() {
  return runJob('rainfall', async () => {
    const zones = await getActiveZones()
    const results = await fetchAllZonesWeather(zones)
    let processed = 0
    let rejected = 0

    for (const { zone, hourly, error } of results) {
      if (error || !hourly) continue

      const windows = computeRollingWindows(hourly)
      if (!windows) continue

      const reading = {
        rainfall_1h: windows.rainfall_1h,
        rainfall_24h: windows.rainfall_24h,
        rainfall_72h: windows.rainfall_72h,
        cumulative_7d: windows.cumulative_7d,
        soil_saturation: windows.soil_saturation,
        ground_movement: null,
        temperature: windows.temperature,
      }

      const { valid, errors } = validateSensorReading(reading)
      if (!valid) {
        logger.warn(`Rejected reading for ${zone.id}`, { errors })
        rejected++
        continue
      }

      await pool.query(
        `INSERT INTO sensor_readings
           (time, zone_id, rainfall_1h, rainfall_24h, rainfall_72h,
            cumulative_7d, soil_saturation, ground_movement, temperature)
         VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          zone.id,
          reading.rainfall_1h,
          reading.rainfall_24h,
          reading.rainfall_72h,
          reading.cumulative_7d,
          reading.soil_saturation,
          reading.ground_movement,
          reading.temperature,
        ],
      )
      processed++
    }

    await pool.query(
      `UPDATE system_health SET status = 'operational',
         message = $1, last_check = NOW()
       WHERE component = 'ingestion'`,
      [`Live Open-Meteo data — ${processed} zones updated, ${rejected} rejected`],
    )

    return { recordsProcessed: processed, metadata: { rejected, source: 'open-meteo' } }
  })
}

export default ingestRainfall
