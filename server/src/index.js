import { createApp } from './app.js'
import env from './config/env.js'
import logger from './config/logger.js'
import { pool } from './config/database.js'
import { getRedisClient } from './config/redis.js'
import { runMigrations } from './db/migrate.js'
import { seedDatabase } from './db/seeds/seed_from_prototype.js'
import { startScheduler, runInitialIngestion } from './scheduler.js'

const app = createApp()

async function waitForDatabase(retries = 30, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1')
      logger.info('Database connection established')
      return
    } catch (err) {
      logger.warn(`Waiting for database... (${i + 1}/${retries})`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw new Error('Could not connect to database')
}

async function bootstrap() {
  await waitForDatabase()

  if (env.migrateOnStart) {
    logger.info('Running database migrations...')
    await runMigrations()
  }

  if (env.seedOnStart) {
    logger.info('Running database seed...')
    await seedDatabase()
  }

  try {
    await getRedisClient()
    logger.info('Redis connection established')
  } catch (err) {
    logger.warn('Redis unavailable — continuing without cache', { error: err.message })
  }

  if (env.nodeEnv !== 'test') {
    startScheduler()
    runInitialIngestion().catch((err) => {
      logger.error('Initial ingestion failed', { error: err.message })
    })
  }

  app.listen(env.port, () => {
    logger.info(`RIDGE server listening on port ${env.port}`)
    logger.info(`Health check: http://localhost:${env.port}/api/v1/health`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    logger.error('Failed to start server', { error: err.message, stack: err.stack })
    process.exit(1)
  })
}

export default app
