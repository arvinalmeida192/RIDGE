import request from 'supertest'
import { createApp } from '../../src/app.js'

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

  it('GET /citizen/login renders citizen login', async () => {
    const res = await request(app).get('/citizen/login')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Citizen Portal/i)
  })
})
