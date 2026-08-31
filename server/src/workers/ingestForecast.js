import { pool } from '../config/database.js'
import {
  fetchAllZonesWeather,
  extractForecastHours,
} from '../services/openMeteo.js'
import { isWithinBounds } from '../services/validateReading.js'
import { runJob } from '../services/ingestionTracker.js'

async function getActiveZones() {
  const { rows } = await pool.query(
    'SELECT id, lat, lng FROM zones WHERE is_active = true ORDER BY id',
  )
  return rows
}

export async function ingestForecast() {
  return runJob('forecast', async () => {
    const zones = await getActiveZones()
    const results = await fetchAllZonesWeather(zones)
    let processed = 0

    for (const { zone, hourly, error } of results) {
      if (error || !hourly) continue

      const forecasts = extractForecastHours(hourly, 24)
      const fetchedAt = new Date()

      for (const f of forecasts) {
        if (!isWithinBounds('precipitation_mm', f.precipitation_mm)) continue

        await pool.query(
          `INSERT INTO weather_forecasts
             (zone_id, forecast_time, fetched_at, precipitation_mm, temperature, soil_moisture)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (zone_id, forecast_time, fetched_at) DO UPDATE SET
             precipitation_mm = EXCLUDED.precipitation_mm,
             temperature = EXCLUDED.temperature,
             soil_moisture = EXCLUDED.soil_moisture`,
          [
            zone.id,
            f.forecast_time,
            fetchedAt,
            f.precipitation_mm,
            f.temperature,
            f.soil_moisture,
          ],
        )
        processed++
      }
    }

    return { recordsProcessed: processed, metadata: { source: 'open-meteo', hours: 24 } }
  })
}

export default ingestForecast
