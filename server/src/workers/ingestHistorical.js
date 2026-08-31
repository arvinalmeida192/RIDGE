import { pool } from '../config/database.js'
import {
  fetchZoneArchive,
  aggregateDailyFromHourly,
} from '../services/openMeteo.js'
import {
  runJob,
  getIngestionState,
  setIngestionState,
} from '../services/ingestionTracker.js'
import env from '../config/env.js'
import logger from '../config/logger.js'

async function getActiveZones() {
  const { rows } = await pool.query(
    'SELECT id, lat, lng FROM zones WHERE is_active = true ORDER BY id',
  )
  return rows
}

function yearsAgoDate(years) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}

function yesterdayDate() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function ingestHistorical({ force = false } = {}) {
  return runJob('historical', async () => {
    const state = await getIngestionState('historical_backfill')
    if (state?.completed && !force) {
      logger.info('Historical backfill already completed — skipping')
      return { recordsProcessed: 0, metadata: { skipped: true } }
    }

    const zones = await getActiveZones()
    const startDate = yearsAgoDate(env.historicalYears)
    const endDate = yesterdayDate()
    let processed = 0

    for (const zone of zones) {
      try {
        const hourly = await fetchZoneArchive(zone.lat, zone.lng, startDate, endDate)
        const daily = aggregateDailyFromHourly(hourly)

        for (const day of daily) {
          await pool.query(
            `INSERT INTO sensor_readings
               (time, zone_id, rainfall_1h, rainfall_24h, rainfall_72h, cumulative_7d)
             VALUES ($1::date + interval '12 hours', $2, 0, $3, $3, $3)
             ON CONFLICT (time, zone_id) DO NOTHING`,
            [day.date, zone.id, day.rainfall_24h],
          )
          processed++
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch (err) {
        logger.warn(`Historical backfill failed for ${zone.id}`, { error: err.message })
      }
    }

    await setIngestionState('historical_backfill', {
      completed: true,
      startDate,
      endDate,
      completedAt: new Date().toISOString(),
      zones: zones.length,
    })

    return {
      recordsProcessed: processed,
      metadata: { startDate, endDate, zones: zones.length, source: 'open-meteo-archive' },
    }
  })
}

export default ingestHistorical
