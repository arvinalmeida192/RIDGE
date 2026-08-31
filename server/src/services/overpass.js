import https from 'https'
import { pool } from '../config/database.js'
import logger from '../config/logger.js'

const OVERPASS_HOSTS = [
  { hostname: 'overpass-api.de', path: '/api/interpreter' },
  { hostname: 'overpass.kumi.systems', path: '/api/interpreter' },
]

const USER_AGENT = 'RIDGE-Landslide-Monitor/2.0 (SIH26001; +https://github.com/ridge-ner)'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function buildRoadsQuery(lat, lng, radiusM = 8000) {
  return `[out:json][timeout:45];
way["highway"~"primary|secondary|tertiary|trunk|motorway|unclassified|residential"](around:${radiusM},${lat},${lng});
out geom;`
}

function buildSettlementsQuery(lat, lng, radiusM = 8000) {
  return `[out:json][timeout:45];
node["place"~"village|town|hamlet|suburb"](around:${radiusM},${lat},${lng});
out;`
}

function postOverpassHttps(query, { hostname, path }) {
  const body = `data=${encodeURIComponent(query)}`

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        timeout: 60000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Overpass HTTP ${res.statusCode}: ${data.slice(0, 120)}`))
            return
          }
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error(`Overpass invalid JSON: ${data.slice(0, 120)}`))
          }
        })
      },
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Overpass request timeout'))
    })
    req.write(body)
    req.end()
  })
}

async function postOverpass(query) {
  let lastError
  for (const host of OVERPASS_HOSTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await postOverpassHttps(query, host)
      } catch (err) {
        lastError = err
        logger.warn(`Overpass attempt failed (${host.hostname})`, { error: err.message, attempt })
        await sleep(2000 * (attempt + 1))
      }
    }
  }
  throw lastError
}

export async function fetchOsmData(lat, lng, radiusM = 8000) {
  const roadsData = await postOverpass(buildRoadsQuery(lat, lng, radiusM))
  await sleep(1000)
  const settlementsData = await postOverpass(buildSettlementsQuery(lat, lng, radiusM))

  return {
    elements: [
      ...(roadsData.elements ?? []),
      ...(settlementsData.elements ?? []),
    ],
  }
}

export function parseOsmElements(elements, zoneId) {
  const roads = []
  const settlements = []

  for (const el of elements) {
    if (el.type === 'way' && el.tags?.highway) {
      const points = (el.geometry ?? [])
        .map((g) => ({ lat: g.lat, lng: g.lon }))
        .filter((p) => p.lat != null && p.lng != null)

      if (points.length >= 2) {
        roads.push({
          id: `osm_w${el.id}`,
          name: el.tags.name ?? el.tags.ref ?? `Highway ${el.tags.highway}`,
          points,
          zoneId,
        })
      }
    }

    if (el.type === 'node' && el.tags?.place) {
      settlements.push({
        id: `osm_n${el.id}`,
        name: el.tags.name ?? el.tags.place,
        lat: el.lat,
        lng: el.lon,
        population: parseInt(el.tags.population ?? '0', 10) || estimatePopulation(el.tags.place),
        zoneId,
      })
    }
  }

  return { roads, settlements }
}

function estimatePopulation(place) {
  const map = { city: 50000, town: 5000, village: 800, hamlet: 200, suburb: 2000 }
  return map[place] ?? 500
}

function wktLineString(points) {
  const coords = points.map((p) => `${p.lng} ${p.lat}`).join(', ')
  return `LINESTRING(${coords})`
}

export async function upsertRoads(roads) {
  let count = 0
  for (const road of roads) {
    await pool.query(
      `INSERT INTO roads (id, name, geom, zone_id)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         geom = EXCLUDED.geom,
         zone_id = EXCLUDED.zone_id`,
      [road.id, road.name, wktLineString(road.points), road.zoneId],
    )
    count++
  }
  return count
}

export async function upsertSettlements(settlements) {
  let count = 0
  for (const s of settlements) {
    await pool.query(
      `INSERT INTO settlements (id, name, population, lat, lng, geom, zone_id)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326), $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         population = EXCLUDED.population,
         geom = EXCLUDED.geom,
         zone_id = EXCLUDED.zone_id`,
      [s.id, s.name, s.population, s.lat, s.lng, s.zoneId],
    )
    count++
  }
  return count
}

export async function ingestZoneOsm(zone, radiusM = 8000) {
  const data = await fetchOsmData(zone.lat, zone.lng, radiusM)
  const { roads, settlements } = parseOsmElements(data.elements ?? [], zone.id)
  const roadCount = await upsertRoads(roads)
  const settlementCount = await upsertSettlements(settlements)
  logger.info(`OSM ingested for ${zone.id}`, { roads: roadCount, settlements: settlementCount })
  await sleep(2000) // rate limit between zones
  return { roadCount, settlementCount }
}
