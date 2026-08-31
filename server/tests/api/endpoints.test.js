import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()
let adminToken

beforeAll(async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'admin' })
  adminToken = res.body.token
})

describe('Auth API', () => {
  it('POST /api/v1/auth/login returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.role).toBe('admin')
  })

  it('POST /api/v1/auth/login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/zones requires no auth', async () => {
    const res = await request(app).get('/api/v1/zones')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('POST /api/v1/scenarios/compute requires admin', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/compute')
      .send({ rainfallMm: 100 })
    expect(res.status).toBe(401)
  })
})

describe('Zones API', () => {
  it('GET /api/v1/zones returns zone list', async () => {
    const res = await request(app).get('/api/v1/zones')
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('riskScore')
    expect(res.body[0]).toHaveProperty('riskLevel')
  })

  it('GET /api/v1/zones/z01 returns zone detail', async () => {
    const res = await request(app).get('/api/v1/zones/z01')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('z01')
  })

  it('GET /api/v1/zones/invalid rejects bad id', async () => {
    const res = await request(app).get('/api/v1/zones/bad')
    expect(res.status).toBe(400)
  })

  it('GET /api/v1/zones/map-data returns geo data', async () => {
    const res = await request(app).get('/api/v1/zones/map-data')
    expect(res.status).toBe(200)
    expect(res.body.zones).toBeDefined()
  })
})

describe('Alerts API', () => {
  it('GET /api/v1/alerts returns alerts', async () => {
    const res = await request(app).get('/api/v1/alerts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/v1/alerts/feed returns feed', async () => {
    const res = await request(app).get('/api/v1/alerts/feed')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('rejects invalid query params', async () => {
    const res = await request(app).get('/api/v1/alerts?state=<script>')
    expect(res.status).toBe(400)
  })
})

describe('Analytics API', () => {
  it('GET /api/v1/analytics/dashboard-stats', async () => {
    const res = await request(app).get('/api/v1/analytics/dashboard-stats')
    expect(res.status).toBe(200)
    expect(res.body.totalZones).toBeGreaterThan(0)
  })
})

describe('Health API', () => {
  it('GET /api/v1/health returns system status', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.phase).toBe(6)
    expect(res.body.checks.database.ok).toBe(true)
  })
})

describe('Pages', () => {
  it('GET / returns landing page', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('RIDGE')
  })

  it('GET /login returns login page', async () => {
    const res = await request(app).get('/login')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Sign In')
  })

  it('GET /partials/alert-feed returns HTML fragment', async () => {
    const res = await request(app).get('/partials/alert-feed')
    expect(res.status).toBe(200)
    expect(res.text.length).toBeGreaterThan(0)
  })
})

describe('Scenarios API (admin)', () => {
  it('POST /api/v1/scenarios/compute with admin token', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/compute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rainfallMm: 200, earthquakeMagnitude: 5, soilMoisturePercent: 30, groundMovementMm: 15 })
    expect(res.status).toBe(200)
    expect(res.body.regionalTier).toBeDefined()
    expect(res.body.simulatedHighRisk).toBeGreaterThanOrEqual(0)
  })
})
