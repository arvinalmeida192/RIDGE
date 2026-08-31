import { Router } from 'express'
import { pool } from '../config/database.js'
import { checkDatabaseHealth } from '../config/database.js'
import { checkRedisHealth } from '../config/redis.js'
import { getLastRuns } from '../services/ingestionTracker.js'
import { checkMlHealth } from '../services/mlService.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { triggerJob, triggerFullRefresh } from '../scheduler.js'
import env from '../config/env.js'

const router = Router()

async function buildHealthResponse() {
  const [db, redis, ml] = await Promise.all([
    checkDatabaseHealth().catch((e) => ({ ok: false, error: e.message })),
    checkRedisHealth(),
    checkMlHealth(),
  ])

  const [
    { rows: zoneCount },
    { rows: alertCount },
    { rows: readingCount },
    { rows: forecastCount },
    { rows: riskScoreCount },
    ingestionRuns,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM zones'),
    pool.query('SELECT COUNT(*)::int AS count FROM alerts WHERE is_active = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM sensor_readings'),
    pool.query('SELECT COUNT(*)::int AS count FROM weather_forecasts'),
    pool.query('SELECT COUNT(*)::int AS count FROM risk_forecasts'),
    getLastRuns(),
  ])

  const { rows: latestReading } = await pool.query(
    'SELECT MAX(time) AS "lastReading" FROM sensor_readings',
  )

  const healthy = db.ok && redis.ok && ml.ok

  return {
    status: healthy ? 'ok' : 'degraded',
    service: 'ridge-server',
    version: '6.0.0',
    phase: 6,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
    checks: {
      database: db,
      redis,
      ml,
    },
    data: {
      zones: zoneCount[0]?.count ?? 0,
      activeAlerts: alertCount[0]?.count ?? 0,
      sensorReadings: readingCount[0]?.count ?? 0,
      weatherForecasts: forecastCount[0]?.count ?? 0,
      riskForecasts: riskScoreCount[0]?.count ?? 0,
      lastSensorReading: latestReading[0]?.lastReading ?? null,
    },
    ingestion: {
      enabled: env.ingestionEnabled,
      scoringEnabled: env.scoringEnabled,
      alertsEnabled: env.alertsEnabled,
      intervalMin: env.ingestionIntervalMin,
      lastRuns: ingestionRuns,
    },
    ml: {
      ok: ml.ok,
      modelVersion: ml.model_version,
      lastTrained: ml.last_trained,
      metrics: ml.metrics,
    },
  }
}

router.get('/health', async (req, res, next) => {
  try {
    const health = await buildHealthResponse()
    res.status(health.status === 'ok' ? 200 : 503).json(health)
  } catch (err) {
    next(err)
  }
})

router.get('/system/health', async (req, res, next) => {
  try {
    const health = await buildHealthResponse()
    const { rows: components } = await pool.query(
      'SELECT component, status, message, last_check AS "lastCheck" FROM system_health ORDER BY component',
    )
    res.status(health.status === 'ok' ? 200 : 503).json({
      ...health,
      pipeline: components,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/system/ingestion', async (req, res, next) => {
  try {
    const runs = await getLastRuns(null, 20)
    const { rows: state } = await pool.query(
      'SELECT key, value, updated_at AS "updatedAt" FROM ingestion_state ORDER BY key',
    )
    res.json({ runs, state })
  } catch (err) {
    next(err)
  }
})

router.post('/system/refresh', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const jobs = await triggerFullRefresh()
    res.json({ ok: true, message: 'Data refresh complete', ...jobs })
  } catch (err) {
    next(err)
  }
})

router.post('/system/ingest/:job', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await triggerJob(req.params.job)
    res.json({ ok: true, job: req.params.job, result })
  } catch (err) {
    if (err.message.startsWith('Unknown ingestion job')) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

export default router
