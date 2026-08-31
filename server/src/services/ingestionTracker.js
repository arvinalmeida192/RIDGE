import { pool } from '../config/database.js'
import logger from '../config/logger.js'

export async function startRun(jobName) {
  const { rows } = await pool.query(
    `INSERT INTO ingestion_runs (job_name, status)
     VALUES ($1, 'running') RETURNING id`,
    [jobName],
  )
  return rows[0].id
}

export async function finishRun(runId, { status, recordsProcessed = 0, errorMessage = null, metadata = {} }) {
  await pool.query(
    `UPDATE ingestion_runs
     SET status = $2, finished_at = NOW(), records_processed = $3,
         error_message = $4, metadata = $5
     WHERE id = $1`,
    [runId, status, recordsProcessed, errorMessage, JSON.stringify(metadata)],
  )
}

export async function updateSystemHealth(component, status, message) {
  await pool.query(
    `INSERT INTO system_health (component, status, message, last_check)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (component) DO UPDATE SET
       status = EXCLUDED.status,
       message = EXCLUDED.message,
       last_check = NOW()`,
    [component, status, message],
  )
}

export async function getIngestionState(key) {
  const { rows } = await pool.query(
    'SELECT value FROM ingestion_state WHERE key = $1',
    [key],
  )
  return rows[0]?.value ?? null
}

export async function setIngestionState(key, value) {
  await pool.query(
    `INSERT INTO ingestion_state (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)],
  )
}

export async function getLastRuns(jobName = null, limit = 5) {
  if (jobName) {
    const { rows } = await pool.query(
      `SELECT job_name AS "jobName", status, started_at AS "startedAt",
              finished_at AS "finishedAt", records_processed AS "recordsProcessed",
              error_message AS "errorMessage", metadata
       FROM ingestion_runs WHERE job_name = $1
       ORDER BY started_at DESC LIMIT $2`,
      [jobName, limit],
    )
    return rows
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT ON (job_name)
       job_name AS "jobName", status, started_at AS "startedAt",
       finished_at AS "finishedAt", records_processed AS "recordsProcessed",
       error_message AS "errorMessage", metadata
     FROM ingestion_runs
     ORDER BY job_name, started_at DESC`,
  )
  return rows
}

export async function runJob(jobName, fn) {
  const runId = await startRun(jobName)
  try {
    const result = await fn()
    await finishRun(runId, {
      status: 'success',
      recordsProcessed: result?.recordsProcessed ?? 0,
      metadata: result?.metadata ?? {},
    })
    await updateSystemHealth(
      `ingestion_${jobName}`,
      'operational',
      `Last run: ${new Date().toISOString()} — ${result?.recordsProcessed ?? 0} records`,
    )
    logger.info(`Ingestion job ${jobName} completed`, { records: result?.recordsProcessed })
    return result
  } catch (err) {
    await finishRun(runId, {
      status: 'failed',
      errorMessage: err.message,
    })
    await updateSystemHealth(`ingestion_${jobName}`, 'degraded', `Failed: ${err.message}`)
    logger.error(`Ingestion job ${jobName} failed`, { error: err.message })
    throw err
  }
}
