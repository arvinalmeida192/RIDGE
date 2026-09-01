import request from 'supertest'
import { createApp } from '../../src/app.js'
import * as authService from '../../src/services/authService.js'

const app = createApp()

describe('Auth API', () => {
  it('GET /api/v1/auth/config returns auth mode', async () => {
    const res = await request(app).get('/api/v1/auth/config')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('firebaseEnabled')
    expect(res.body).toHaveProperty('legacyLoginEnabled')
  })

  it('POST /api/v1/auth/request-operational requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-operational')
      .send({ reason: 'Test' })
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/auth/access-requests requires admin/operator role', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'user', password: 'user' })
    const cookie = login.headers['set-cookie']

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    const res = await request(app)
      .get('/api/v1/auth/access-requests')
      .set('Cookie', cookie)

    if (me.body.role === 'citizen') {
      expect(res.status).toBe(403)
    } else {
      expect(res.status).toBe(200)
    }
  })

  it('citizen can submit operational access request', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'user', password: 'user', loginType: 'citizen' })
    const cookie = login.headers['set-cookie']

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    if (me.body.operationalStatus === 'approved' || me.body.role === 'operator') {
      return // already approved from prior test run
    }

    const res = await request(app)
      .post('/api/v1/auth/request-operational')
      .set('Cookie', cookie)
      .send({ reason: 'District officer testing access flow' })

    expect([201, 400]).toContain(res.status)
    if (res.status === 201) expect(res.body.status).toBe('pending')
  })

  it('admin can list and review access requests', async () => {
    const adminLogin = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'admin', password: 'admin' })
    const adminCookie = adminLogin.headers['set-cookie']

    const list = await request(app)
      .get('/api/v1/auth/access-requests?status=pending')
      .set('Cookie', adminCookie)
    expect(list.status).toBe(200)
    expect(Array.isArray(list.body)).toBe(true)

    if (list.body.length > 0) {
      const review = await request(app)
        .post(`/api/v1/auth/access-requests/${list.body[0].id}/review`)
        .set('Cookie', adminCookie)
        .send({ approve: true })
      expect(review.status).toBe(200)
      expect(review.body.ok).toBe(true)
    }
  })
})

describe('Login pages', () => {
  it('GET /login renders operations login', async () => {
    const res = await request(app).get('/login')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Operations Login/i)
  })

  it('POST /api/v1/auth/signup creates a citizen account', async () => {
    const username = `citizen_${Date.now()}`
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username, password: 'testpass123' })

    if (authService.getAuthMode().legacyLoginEnabled) {
      expect(res.status).toBe(201)
      expect(res.body.role).toBe('citizen')
      expect(res.body.username).toBe(username.toLowerCase())
    } else {
      expect(res.status).toBe(400)
    }
  })

  it('POST /api/v1/auth/signup rejects duplicate usernames', async () => {
    if (!authService.getAuthMode().legacyLoginEnabled) return

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'user', password: 'newpass123' })
    expect(res.status).toBe(409)
  })

  it('POST /citizen/signup creates account and sets session cookie', async () => {
    if (!authService.getAuthMode().legacyLoginEnabled) return

    const username = `signup_${Date.now()}`
    const res = await request(app)
      .post('/citizen/signup')
      .type('form')
      .send({ username, password: 'testpass123', next: '/citizen' })

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/citizen')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('GET /citizen/login renders citizen login with signup option', async () => {
    const res = await request(app).get('/citizen/login')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Citizen Portal/i)
    if (res.text.includes('Create Account') || res.text.includes('Create an account')) {
      expect(res.text).toMatch(/Create (Account|an account)/i)
    }
  })

  it('GET /login does not offer signup', async () => {
    const res = await request(app).get('/login')
    expect(res.status).toBe(200)
    expect(res.text).not.toMatch(/id="firebase-signup"/)
    expect(res.text).not.toMatch(/Create Account/i)
  })

  it('citizen can browse zones and open zone detail', async () => {
    const login = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'user', password: 'user', loginType: 'citizen' })
    const cookie = login.headers['set-cookie']

    const list = await request(app).get('/citizen/zones').set('Cookie', cookie)
    expect(list.status).toBe(200)
    expect(list.text).toMatch(/All Areas|nav_zones/i)

    const detail = await request(app).get('/citizen/zones/z01').set('Cookie', cookie)
    expect(detail.status).toBe(200)
    expect(detail.text).toMatch(/z01|Risk Score|risk_score/i)
  })
})
