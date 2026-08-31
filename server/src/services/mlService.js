import env from '../config/env.js'
import logger from '../config/logger.js'

const BASE = env.mlServiceUrl.replace(/\/$/, '')

async function mlFetch(path, body, timeoutMs = 60000) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ML service ${path} HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json()
}

export async function checkMlHealth() {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = await res.json()
    return { ok: data.status === 'healthy', ...data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function predictBatch(zones) {
  return mlFetch('/predict/batch', {
    zones: zones.map((z) => ({
      zone_id: z.id,
      features: z.features,
      static_attrs: z.static_attrs,
    })),
  })
}

export async function explainZone(zoneId, features) {
  return mlFetch('/explain', { zone_id: zoneId, features }, 30000)
}

export async function forecastZone(zoneId, features, hourlyForecast) {
  return mlFetch('/forecast', {
    zone_id: zoneId,
    features,
    hourly_forecast: hourlyForecast,
  }, 60000)
}

export async function triggerRetrain() {
  const res = await fetch(`${BASE}/train`, {
    method: 'POST',
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`Retrain failed: ${res.status}`)
  return res.json()
}

export default { checkMlHealth, predictBatch, explainZone, forecastZone, triggerRetrain }
