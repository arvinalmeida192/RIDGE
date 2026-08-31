import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'
import { runJob } from '../services/ingestionTracker.js'
import logger from '../config/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestZone(lat, lng, zones) {
  let nearest = zones[0]
  let minDist = Infinity
  for (const z of zones) {
    const d = haversineKm(lat, lng, z.lat, z.lng)
    if (d < minDist) {
      minDist = d
      nearest = z
    }
  }
  return minDist <= 50 ? nearest : null
}

export async function ingestGsi() {
  return runJob('gsi', async () => {
    const gsiPath = path.join(__dirname, '../data/gsi_landslides.json')
    const incidents = JSON.parse(readFileSync(gsiPath, 'utf8'))

    const { rows: zones } = await pool.query(
      'SELECT id, lat, lng FROM zones WHERE is_active = true',
    )

    let processed = 0
    const zoneEventCounts = new Map(zones.map((z) => [z.id, 0]))

    for (const inc of incidents) {
      const zone = findNearestZone(inc.lat, inc.lng, zones)
      if (!zone) continue

      const result = await pool.query(
        `INSERT INTO historical_incidents (zone_id, event_date, description, severity, source)
         SELECT $1::varchar, $2::date, $3, $4, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM historical_incidents
           WHERE zone_id = $1::varchar AND event_date = $2::date AND description = $3
         )`,
        [zone.id, inc.date, inc.description, inc.severity, inc.source ?? 'GSI'],
      )

      if (result.rowCount > 0) {
        processed++
        zoneEventCounts.set(zone.id, (zoneEventCounts.get(zone.id) ?? 0) + 1)
      }
    }

    // Update historical_events count on zone_static_attributes
    for (const [zoneId, count] of zoneEventCounts) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM historical_incidents WHERE zone_id = $1`,
        [zoneId],
      )
      const total = rows[0].total

      await pool.query(
        `INSERT INTO zone_static_attributes (zone_id, historical_events)
         VALUES ($1, $2)
         ON CONFLICT (zone_id) DO UPDATE SET
           historical_events = EXCLUDED.historical_events,
           updated_at = NOW()`,
        [zoneId, total],
      )
    }

    logger.info('GSI landslide inventory imported', { processed, zones: zones.length })
    return {
      recordsProcessed: processed,
      metadata: { source: 'gsi-inventory', totalIncidents: incidents.length },
    }
  })
}

export default ingestGsi
