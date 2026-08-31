import cron from 'node-cron'
import logger from './config/logger.js'
import env from './config/env.js'
import ingestRainfall from './workers/ingestRainfall.js'
import ingestForecast from './workers/ingestForecast.js'
import ingestHistorical from './workers/ingestHistorical.js'
import ingestOsm from './workers/ingestOsm.js'
import ingestGsi from './workers/ingestGsi.js'
import ingestTerrain from './workers/ingestTerrain.js'
import scoreRisk from './workers/scoreRisk.js'
import scoreForecast from './workers/scoreForecast.js'
import evaluateAlerts from './workers/evaluateAlerts.js'
import { updateSystemHealth } from './services/ingestionTracker.js'

const jobs = []

function schedule(name, cronExpr, fn) {
  if (!cron.validate(cronExpr)) {
    logger.error(`Invalid cron expression for ${name}: ${cronExpr}`)
    return
  }

  const task = cron.schedule(cronExpr, async () => {
    logger.info(`Scheduled job starting: ${name}`)
    try {
      await fn()
    } catch (err) {
      logger.error(`Scheduled job ${name} failed`, { error: err.message })
    }
  })

  jobs.push({ name, task })
  logger.info(`Scheduled ${name}: ${cronExpr}`)
}

async function ingestRainfallAndScore() {
  await ingestRainfall()
  if (env.scoringEnabled) {
    await scoreRisk()
    if (env.alertsEnabled) {
      await evaluateAlerts()
    }
  }
}

async function ingestForecastAndScore() {
  await ingestForecast()
  if (env.scoringEnabled) {
    await scoreForecast()
  }
}

export function startScheduler() {
  if (!env.ingestionEnabled) {
    logger.info('Ingestion scheduler disabled (INGESTION_ENABLED=false)')
    return
  }

  schedule('rainfall', `*/${env.ingestionIntervalMin} * * * *`, ingestRainfallAndScore)
  schedule('forecast', '0 * * * *', ingestForecastAndScore)
  schedule('historical', '0 2 * * *', () => ingestHistorical({ force: false }))
  schedule('osm', '0 3 1 * *', ingestOsm)
  schedule('terrain', '0 4 * * 0', ingestTerrain)

  logger.info('Ingestion scheduler started', {
    intervalMin: env.ingestionIntervalMin,
    scoringEnabled: env.scoringEnabled,
    alertsEnabled: env.alertsEnabled,
    jobs: jobs.map((j) => j.name),
  })
}

export async function runInitialIngestion() {
  if (!env.ingestionOnStart) {
    logger.info('Skipping initial ingestion (INGESTION_ON_START=false)')
    return
  }

  logger.info('Running initial ingestion pipeline...')
  await updateSystemHealth('ingestion', 'running', 'Initial ingestion in progress')

  const steps = [
    { name: 'terrain', fn: ingestTerrain },
    { name: 'gsi', fn: ingestGsi },
    { name: 'rainfall', fn: ingestRainfall },
    { name: 'forecast', fn: ingestForecast },
  ]

  if (env.ingestionOsmOnStart) {
    steps.push({ name: 'osm', fn: ingestOsm })
  }

  for (const step of steps) {
    try {
      await step.fn()
    } catch (err) {
      logger.error(`Initial ${step.name} ingestion failed`, { error: err.message })
    }
  }

  if (env.scoringEnabled) {
    try {
      await scoreRisk()
      await scoreForecast()
      if (env.alertsEnabled) {
        await evaluateAlerts()
      }
    } catch (err) {
      logger.error('Initial ML scoring failed', { error: err.message })
    }
  }

  if (env.ingestionHistoricalOnStart) {
    ingestHistorical({ force: false }).catch((err) => {
      logger.error('Initial historical backfill failed', { error: err.message })
    })
  }

  await updateSystemHealth('ingestion', 'operational', 'Initial ingestion complete')
}

export function stopScheduler() {
  for (const { name, task } of jobs) {
    task.stop()
    logger.info(`Stopped scheduler job: ${name}`)
  }
}

export async function triggerFullRefresh() {
  await ingestRainfallAndScore()
  await ingestForecastAndScore()
  await updateSystemHealth('ingestion', 'operational', 'Manual data refresh complete')
  return { jobs: ['rainfall', 'scoring', 'alerts', 'forecast', 'risk_forecast'] }
}

export async function triggerJob(jobName) {
  const map = {
    rainfall: ingestRainfallAndScore,
    forecast: ingestForecastAndScore,
    historical: () => ingestHistorical({ force: true }),
    osm: ingestOsm,
    gsi: ingestGsi,
    terrain: ingestTerrain,
    scoring: scoreRisk,
    risk_forecast: scoreForecast,
    alerts: evaluateAlerts,
  }

  const fn = map[jobName]
  if (!fn) throw new Error(`Unknown ingestion job: ${jobName}`)
  return fn()
}

export default { startScheduler, runInitialIngestion, stopScheduler, triggerJob, triggerFullRefresh }
