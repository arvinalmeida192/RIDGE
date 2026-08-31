import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export function authenticate(req, res, next) {
  let token = null
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7)
  } else if (req.cookies?.ridge_token) {
    token = req.cookies.ridge_token
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      operationalStatus: user.operational_status,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}
