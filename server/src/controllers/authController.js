import * as authService from '../services/authService.js'
import env from '../config/env.js'

const COOKIE_OPTS = {
  httpOnly: true,
  maxAge: 8 * 60 * 60 * 1000,
  sameSite: 'lax',
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const mode = authService.getAuthMode()
    if (!mode.legacyLoginEnabled) {
      return res.status(400).json({ error: 'Use Firebase authentication' })
    }

    const result = await authService.loginUser(username, password)
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function firebaseAuth(req, res, next) {
  try {
    const { idToken, loginType } = req.body
    if (!idToken || !loginType) {
      return res.status(400).json({ error: 'idToken and loginType are required' })
    }
    if (!['citizen', 'operational'].includes(loginType)) {
      return res.status(400).json({ error: 'loginType must be citizen or operational' })
    }

    const result = await authService.authenticateWithFirebase(idToken, loginType)
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
}

export async function firebaseSession(req, res, next) {
  try {
    const { idToken, loginType } = req.body
    if (!idToken || !loginType) {
      return res.status(400).json({ error: 'idToken and loginType are required' })
    }

    const result = await authService.authenticateWithFirebase(idToken, loginType)
    res.cookie('ridge_token', result.token, COOKIE_OPTS)
    res.json({ ok: true, redirect: result.redirect, role: result.role })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.sub)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function requestOperational(req, res, next) {
  try {
    const { reason } = req.body
    const request = await authService.requestOperationalAccess(req.user.sub, reason)
    res.status(201).json(request)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
}

export async function listRequests(req, res, next) {
  try {
    const requests = await authService.listAccessRequests({ status: req.query.status })
    res.json(requests)
  } catch (err) {
    next(err)
  }
}

export async function reviewRequest(req, res, next) {
  try {
    const approve = req.body.approve === true || req.body.action === 'approve'
    const result = await authService.reviewAccessRequest(req.params.id, req.user.sub, {
      approve,
      notes: req.body.notes,
    })
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
}

export async function authConfig(req, res) {
  const mode = authService.getAuthMode()
  const { getFirebaseWebConfig } = await import('../config/firebase.js')
  res.json({
    ...mode,
    firebase: getFirebaseWebConfig(),
  })
}

export default {
  login,
  firebaseAuth,
  firebaseSession,
  me,
  requestOperational,
  listRequests,
  reviewRequest,
  authConfig,
}
