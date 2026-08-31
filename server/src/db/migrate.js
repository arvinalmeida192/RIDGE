import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'
import logger from '../config/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

export async function runMigrations() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file],
      )
      if (rows.length > 0) {
        logger.info(`Migration already applied: ${file}`)
        continue
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file],
        )
        await client.query('COMMIT')
        logger.info(`Applied migration: ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    client.release()
  }
}

import { pathToFileURL } from 'url'

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  runMigrations()
    .then(() => {
      logger.info('Migrations complete')
      process.exit(0)
    })
    .catch((err) => {
      logger.error('Migration failed', { error: err.message })
      process.exit(1)
    })
}
