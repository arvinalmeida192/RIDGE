import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../../..')
dotenv.config({ path: path.join(projectRoot, '.env') })
dotenv.config()

function parseServiceAccount(json) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!filePath) return null
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath)
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8'))
  } catch {
    return null
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://ridge:ridge_dev_password@localhost:5432/ridge',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'ridge-dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  logLevel: process.env.LOG_LEVEL || 'info',
  migrateOnStart: process.env.DB_MIGRATE_ON_START === 'true',
  seedOnStart: process.env.DB_SEED_ON_START === 'true',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  openMeteoBaseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  openMeteoArchiveUrl: process.env.OPEN_METEO_ARCHIVE_URL || 'https://archive-api.open-meteo.com/v1/archive',
  ingestionEnabled: process.env.INGESTION_ENABLED !== 'false',
  ingestionOnStart: process.env.INGESTION_ON_START !== 'false',
  ingestionOsmOnStart: process.env.INGESTION_OSM_ON_START === 'true',
  ingestionHistoricalOnStart: process.env.INGESTION_HISTORICAL_ON_START === 'true',
  ingestionIntervalMin: parseInt(process.env.INGESTION_INTERVAL_MIN || '15', 10),
  historicalYears: parseInt(process.env.HISTORICAL_YEARS || '2', 10),
  scoringEnabled: process.env.SCORING_ENABLED !== 'false',
  scoringOnStart: process.env.SCORING_ON_START !== 'false',
  alertsEnabled: process.env.ALERTS_ENABLED !== 'false',
  notificationsEnabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
  alertCooldownMin: parseInt(process.env.ALERT_COOLDOWN_MIN || '60', 10),
  msg91ApiKey: process.env.MSG91_API_KEY || '',
  msg91SenderId: process.env.MSG91_SENDER_ID || 'RIDGE',
  authorityAlertEmail: process.env.AUTHORITY_ALERT_EMAIL || '',
  smtpEnabled: process.env.SMTP_ENABLED === 'true',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseApiKey: process.env.FIREBASE_API_KEY || '',
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  firebaseAuthEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  firebaseServiceAccount: loadServiceAccount(),
  firebaseBootstrapAdminEmails: (process.env.FIREBASE_BOOTSTRAP_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  firebaseEnabled: process.env.NODE_ENV !== 'test' && Boolean(process.env.FIREBASE_PROJECT_ID),
  legacyLoginEnabled: process.env.NODE_ENV === 'test' || process.env.LEGACY_LOGIN_ENABLED === 'true',
}

export default env
