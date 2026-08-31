import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export function pageAuth(req, res, next) {
  const token = req.cookies?.ridge_token
  if (!token) {
    const nextUrl = encodeURIComponent(req.originalUrl)
    return res.redirect(`/?next=${nextUrl}`)
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret)
    next()
  } catch {
    res.clearCookie('ridge_token')
    res.redirect('/')
  }
}

export function optionalPageAuth(req, res, next) {
  const token = req.cookies?.ridge_token
  if (token) {
    try {
      req.user = jwt.verify(token, env.jwtSecret)
    } catch { /* ignore */ }
  }
  next()
}

export function pageRequireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send('Access denied — insufficient permissions.')
    }
    next()
  }
}

export function pageRequireOperational(req, res, next) {
  if (!req.user) {
    return res.redirect(`/?next=${encodeURIComponent(req.originalUrl)}`)
  }
  const ok = ['admin', 'operator'].includes(req.user.role)
    && (req.user.role === 'admin' || req.user.operationalStatus === 'approved')
  if (!ok) {
    return res.status(403).send('Operational access required. Apply via the Citizen Portal.')
  }
  next()
}
