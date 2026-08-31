import { pool } from '../src/config/database.js'
import { runMigrations } from '../src/db/migrate.js'
import { seedDatabase } from '../src/db/seeds/seed_from_prototype.js'

export default async function globalSetup() {
  process.env.NODE_ENV = 'test'
  await pool.query('SELECT 1')
  await runMigrations()
  await seedDatabase()
}
