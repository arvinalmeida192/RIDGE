#!/usr/bin/env node
/**
 * Performance benchmark — run against a live stack.
 * Usage: BASE_URL=http://localhost:3002 node scripts/benchmark.js
 */

const BASE = process.env.BASE_URL || 'http://localhost:3002'

async function timed(label, fn) {
  const start = performance.now()
  const result = await fn()
  const ms = performance.now() - start
  return { label, ms, result, ok: true }
}

async function main() {
  console.log(`RIDGE Performance Benchmark — ${BASE}\n`)

  const results = []

  // Login
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' }),
  })
  const { token } = await loginRes.json()
  const auth = { Authorization: `Bearer ${token}` }

  results.push(await timed('Health endpoint', () =>
    fetch(`${BASE}/api/v1/health`).then((r) => r.json())))

  results.push(await timed('Dashboard page', () =>
    fetch(`${BASE}/dashboard`, { headers: { Cookie: `ridge_token=${token}` } })
      .then((r) => ({ status: r.status, size: r.headers.get('content-length') }))))

  results.push(await timed('HTMX alert-feed partial', () =>
    fetch(`${BASE}/partials/alert-feed`).then((r) => ({ status: r.status }))))

  results.push(await timed('Zones API (15 zones)', () =>
    fetch(`${BASE}/api/v1/zones`, { headers: auth }).then((r) => r.json())))

  results.push(await timed('Scoring trigger', () =>
    fetch(`${BASE}/api/v1/system/ingest/scoring`, {
      method: 'POST',
      headers: auth,
    }).then((r) => r.json())))

  const thresholds = {
    'Health endpoint': 500,
    'Dashboard page': 2000,
    'HTMX alert-feed partial': 200,
    'Zones API (15 zones)': 500,
    'Scoring trigger': 5000,
  }

  let passed = 0
  for (const { label, ms } of results) {
    const limit = thresholds[label] || 5000
    const ok = ms < limit
    if (ok) passed++
    console.log(`${ok ? '✓' : '✗'} ${label}: ${ms.toFixed(0)}ms (limit: ${limit}ms)`)
  }

  console.log(`\n${passed}/${results.length} benchmarks passed`)
  process.exit(passed === results.length ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
