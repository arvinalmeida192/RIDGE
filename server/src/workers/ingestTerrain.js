import { pool } from '../config/database.js'
import {
  fetchElevation,
  estimateSlopeFromElevation,
} from '../services/openMeteo.js'
import { runJob } from '../services/ingestionTracker.js'
import logger from '../config/logger.js'

async function getActiveZones() {
  const { rows } = await pool.query(
    'SELECT id, lat, lng FROM zones WHERE is_active = true ORDER BY id',
  )
  return rows
}

/**
 * Enriches zone_static_attributes using Open-Meteo elevation API.
 * Full GEE integration available via ml-service/scripts/ingest_gee.py
 */
export async function ingestTerrain() {
  return runJob('terrain', async () => {
    const zones = await getActiveZones()
    let processed = 0

    for (const zone of zones) {
      try {
        const [elevation, slope] = await Promise.all([
          fetchElevation(zone.lat, zone.lng),
          estimateSlopeFromElevation(zone.lat, zone.lng),
        ])

        await pool.query(
          `INSERT INTO zone_static_attributes (zone_id, elevation_m, slope_angle, land_cover, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (zone_id) DO UPDATE SET
             elevation_m = COALESCE(EXCLUDED.elevation_m, zone_static_attributes.elevation_m),
             slope_angle = COALESCE(EXCLUDED.slope_angle, zone_static_attributes.slope_angle),
             updated_at = NOW()`,
          [zone.id, elevation, slope, 'forest'],
        )
        processed++
        await new Promise((r) => setTimeout(r, 400))
      } catch (err) {
        logger.warn(`Terrain enrichment failed for ${zone.id}`, { error: err.message })
      }
    }

    return {
      recordsProcessed: processed,
      metadata: { source: 'open-meteo-elevation', note: 'GEE script available for full terrain' },
    }
  })
}

export default ingestTerrain
