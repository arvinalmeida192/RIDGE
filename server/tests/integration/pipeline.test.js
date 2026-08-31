import request from 'supertest'
import { createApp } from '../../src/app.js'
import { matchingRule } from '../../src/services/alertRules.js'

const app = createApp()

describe('Integration: alert pipeline logic', () => {
  it('high risk score matches Warning tier', () => {
    const rule = matchingRule({
      id: 'z01',
      name: 'Sohra',
      risk_score: 4.6,
      risk_level: 'Critical',
      risk_trend_6h: 0,
      active_triggers: [],
    })
    expect(rule?.tier).toBe('Warning')
  })

  it('trigger-only zone matches Advisory', () => {
    const rule = matchingRule({
      id: 'z02',
      name: 'Test',
      risk_score: 1.5,
      risk_level: 'Low',
      risk_trend_6h: 0,
      active_triggers: ['heavy_rainfall'],
    })
    expect(rule?.tier).toBe('Advisory')
  })
})

describe('Integration: citizen portal', () => {
  it('GET /api/v1/citizen/alerts returns zone alerts', async () => {
    const res = await request(app).get('/api/v1/citizen/alerts?zone_id=z01')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST /api/v1/citizen/subscribe normalizes phone with cookie auth', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'user', password: 'user', next: '/citizen/subscribe' })
    const cookie = login.headers['set-cookie']

    const res = await request(app)
      .post('/api/v1/citizen/subscribe')
      .set('Cookie', cookie)
      .send({ zoneId: 'z01', phone: '9876543210' })

    expect(res.status).toBe(201)
    expect(res.body.phone).toBe('+919876543210')
    expect(res.body.isActive).toBe(true)
  })

  it('POST /api/v1/citizen/subscribe rejects invalid phone', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'user', password: 'user' })
    const cookie = login.headers['set-cookie']

    const res = await request(app)
      .post('/api/v1/citizen/subscribe')
      .set('Cookie', cookie)
      .send({ zoneId: 'z01', phone: '12345' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid phone/i)
  })

  it('GET /citizen/subscribe requires authentication', async () => {
    const res = await request(app).get('/citizen/subscribe')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/^\/\?next=/)
  })
})

describe('Integration: login flow', () => {
  it('POST /login redirects to dashboard on success', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'admin', password: 'admin', next: '/dashboard' })
    expect(login.status).toBe(302)
    expect(login.headers.location).toBe('/dashboard')
    expect(login.headers['set-cookie']).toBeDefined()
  })

  it('GET /dashboard requires authentication', async () => {
    const res = await request(app).get('/dashboard')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/^\/\?next=/)
  })

  it('GET / shows landing page for unauthenticated users', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Regional Integrated Disaster/i)
  })
})
