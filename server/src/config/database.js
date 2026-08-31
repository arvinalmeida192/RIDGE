import pg from 'pg'
import env from './env.js'
import logger from './logger.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message })
})

export async function checkDatabaseHealth() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT NOW() AS now, PostGIS_Version() AS postgis_version')
    return { ok: true, ...rows[0] }
  } finally {
    client.release()
  }
}

export default pool
