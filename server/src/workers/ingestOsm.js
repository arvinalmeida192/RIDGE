import { pool } from '../config/database.js'
import { ingestZoneOsm } from '../services/overpass.js'
import { runJob } from '../services/ingestionTracker.js'
import logger from '../config/logger.js'

async function getActiveZones() {
  const { rows } = await pool.query(
    'SELECT id, name, lat, lng FROM zones WHERE is_active = true ORDER BY id',
  )
  return rows
}

export async function ingestOsm() {
  return runJob('osm', async () => {
    const zones = await getActiveZones()
    let roadCount = 0
    let settlementCount = 0

    for (const zone of zones) {
      try {
        const result = await ingestZoneOsm(zone)
        roadCount += result.roadCount
        settlementCount += result.settlementCount
      } catch (err) {
        logger.warn(`OSM ingestion failed for ${zone.id}`, { error: err.message })
      }
    }

    return {
      recordsProcessed: roadCount + settlementCount,
      metadata: { roads: roadCount, settlements: settlementCount, source: 'overpass-api' },
    }
  })
}

export default ingestOsm
