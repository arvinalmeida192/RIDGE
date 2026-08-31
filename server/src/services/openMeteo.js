import env from '../config/env.js'
import logger from '../config/logger.js'

const FORECAST_URL = `${env.openMeteoBaseUrl}/forecast`
const ARCHIVE_URL = env.openMeteoArchiveUrl
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation'

async function fetchJson(url, retries = 3) {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}: ${await res.text()}`)
      }
      return res.json()
    } catch (err) {
      lastError = err
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      }
    }
  }
  throw lastError
}

export async function fetchZoneForecast(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: 'precipitation,temperature_2m,soil_moisture_0_to_7cm',
    past_days: '7',
    forecast_days: '2',
    timezone: 'Asia/Kolkata',
  })

  const data = await fetchJson(`${FORECAST_URL}?${params}`)
  return data.hourly
}

export async function fetchZoneArchive(lat, lng, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: startDate,
    end_date: endDate,
    hourly: 'precipitation,temperature_2m',
    timezone: 'Asia/Kolkata',
  })

  const data = await fetchJson(`${ARCHIVE_URL}?${params}`)
  return data.hourly
}

export async function fetchElevation(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
  })
  const data = await fetchJson(`${ELEVATION_URL}?${params}`)
  return data.elevation?.[0] ?? null
}

/** Sample 4 neighbors ~0.01° away to estimate slope in degrees */
export async function estimateSlopeFromElevation(lat, lng) {
  const delta = 0.01
  const points = [
    [lat, lng],
    [lat + delta, lng],
    [lat - delta, lng],
    [lat, lng + delta],
    [lat, lng - delta],
  ]

  const elevations = await Promise.all(
    points.map(([la, ln]) => fetchElevation(la, ln).catch(() => null)),
  )

  const center = elevations[0]
  if (center === null) return null

  const diffs = elevations.slice(1)
    .filter((e) => e !== null)
    .map((e) => Math.abs(e - center))

  if (diffs.length === 0) return null

  const maxDiff = Math.max(...diffs)
  const horizontalM = delta * 111000
  const slopeRad = Math.atan(maxDiff / horizontalM)
  return Math.round((slopeRad * 180) / Math.PI * 10) / 10
}

export function computeRollingWindows(hourly) {
  const precip = hourly.precipitation ?? []
  const soil = hourly.soil_moisture_0_to_7cm ?? []
  const temp = hourly.temperature_2m ?? []
  const times = hourly.time ?? []

  const len = times.length
  if (len === 0) return null

  const pastEnd = len - 1
  // Find split between past and forecast (last past hour before future)
  // With past_days=7 and forecast_days=2, past is roughly first 7*24 hours
  const nowIdx = pastEnd - 48 // approximate current hour index (within forecast section start)

  const safeSlice = (arr, start, end) => {
    const s = Math.max(0, start)
    const e = Math.min(arr.length, end)
    return arr.slice(s, e)
  }

  const sum = (arr) => arr.reduce((a, b) => a + (b ?? 0), 0)

  const idx = Math.max(0, len - 49) // ~current hour in combined series
  const rainfall1h = precip[idx] ?? 0
  const rainfall24h = sum(safeSlice(precip, idx - 23, idx + 1))
  const rainfall72h = sum(safeSlice(precip, idx - 71, idx + 1))
  const cumulative7d = sum(safeSlice(precip, idx - 167, idx + 1))

  const soilVal = soil[idx]
  const soilSaturation = soilVal != null
    ? Math.min(100, Math.round(soilVal * 100))
    : null

  return {
    time: times[idx],
    rainfall_1h: Math.round(rainfall1h * 10) / 10,
    rainfall_24h: Math.round(rainfall24h * 10) / 10,
    rainfall_72h: Math.round(rainfall72h * 10) / 10,
    cumulative_7d: Math.round(cumulative7d * 10) / 10,
    soil_saturation: soilSaturation,
    temperature: temp[idx] != null ? Math.round(temp[idx] * 10) / 10 : null,
    hourlyTimes: times,
    hourlyPrecip: precip,
    hourlyTemp: temp,
    hourlySoil: soil,
    currentIndex: idx,
  }
}

export function extractForecastHours(hourly, hoursAhead = 24) {
  const times = hourly.time ?? []
  const precip = hourly.precipitation ?? []
  const temp = hourly.temperature_2m ?? []
  const soil = hourly.soil_moisture_0_to_7cm ?? []
  const now = Date.now()

  const forecasts = []
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= now) continue
    forecasts.push({
      forecast_time: times[i],
      precipitation_mm: precip[i] ?? 0,
      temperature: temp[i] ?? null,
      soil_moisture: soil[i] != null ? soil[i] * 100 : null,
    })
    if (forecasts.length >= hoursAhead) break
  }
  return forecasts
}

export function aggregateDailyFromHourly(hourly) {
  const times = hourly.time ?? []
  const precip = hourly.precipitation ?? []
  const daily = new Map()

  for (let i = 0; i < times.length; i++) {
    const day = times[i].slice(0, 10)
    daily.set(day, (daily.get(day) ?? 0) + (precip[i] ?? 0))
  }

  return [...daily.entries()].map(([date, total]) => ({
    date,
    rainfall_24h: Math.round(total * 10) / 10,
  }))
}

export async function fetchAllZonesWeather(zones, delayMs = 300) {
  const results = []
  for (const zone of zones) {
    try {
      const hourly = await fetchZoneForecast(zone.lat, zone.lng)
      results.push({ zone, hourly, error: null })
    } catch (err) {
      logger.warn(`Open-Meteo fetch failed for ${zone.id}`, { error: err.message })
      results.push({ zone, hourly: null, error: err.message })
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  }
  return results
}
