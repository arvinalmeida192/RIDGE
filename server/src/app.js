import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import env from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { validateQuery } from './middleware/validate.js'
import authRoutes from './routes/auth.js'
import zonesRoutes from './routes/zones.js'
import alertsRoutes from './routes/alerts.js'
import citizenRoutes from './routes/citizen.js'
import pagesRoutes from './routes/pages.js'
import analyticsRoutes from './routes/analytics.js'
import scenariosRoutes from './routes/scenarios.js'
import newsRoutes from './routes/news.js'
import systemRoutes from './routes/system.js'
import partialsRoutes from './routes/partials.js'
import { initFirebase, getFirebaseWebConfig } from './config/firebase.js'
import { addClient } from './services/sseHub.js'
import { formatISTDateTime, formatISTDate, formatISTTime } from './utils/formatIST.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }))
  app.use(cors({
    origin: env.corsOrigins,
    credentials: true,
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use((req, res, next) => {
    req.cookies = {}
    const header = req.headers.cookie
    if (header) {
      for (const part of header.split(';')) {
        const [k, ...v] = part.trim().split('=')
        if (k) req.cookies[k] = decodeURIComponent(v.join('='))
      }
    }
    next()
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'test' ? 1000 : 50,
    message: { error: 'Too many login attempts, please try again later' },
  })
  app.use('/api/v1/auth/login', authLimiter)
  app.use('/api/v1/auth/signup', authLimiter)

  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, '../views'))
  app.locals.formatIST = formatISTDateTime
  app.locals.formatISTDate = formatISTDate
  app.locals.formatISTTime = formatISTTime
  initFirebase()
  app.locals.firebaseConfig = getFirebaseWebConfig()
  app.use(express.static(path.join(__dirname, '../public')))

  app.use('/', pagesRoutes)
  app.use('/api/v1', systemRoutes)
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/zones', validateQuery({ state: 'string' }), zonesRoutes)
  app.use('/api/v1/alerts', validateQuery({ state: 'string', tier: 'string', active: 'string' }), alertsRoutes)
  app.use('/api/v1/citizen', citizenRoutes)
  app.use('/api/v1/analytics', analyticsRoutes)
  app.use('/api/v1/scenarios', scenariosRoutes)
  app.use('/api/v1/news', validateQuery({ state: 'string' }), newsRoutes)

  app.get('/api/v1/events/alerts', (req, res) => {
    addClient(res)
  })

  app.use('/partials', partialsRoutes)

  app.get('/status', (req, res) => {
    res.render('pages/status', {
      title: 'RIDGE System Status',
      phase: 6,
    })
  })

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp
