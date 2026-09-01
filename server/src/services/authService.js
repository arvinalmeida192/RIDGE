import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'
import { signToken } from '../middleware/auth.js'
import env from '../config/env.js'
import { verifyFirebaseToken, setFirebaseCustomClaims, isFirebaseReady } from '../config/firebase.js'

const OPERATIONAL_ROLES = ['admin', 'operator']

function mapUserRow(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    operationalStatus: row.operational_status,
    preferredLang: row.preferred_lang,
  }
}

export async function registerCitizen(username, password, email = null) {
  const normalized = username.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,50}$/.test(normalized)) {
    throw Object.assign(
      new Error('Username must be 3–50 characters (letters, numbers, underscore only)'),
      { status: 400 },
    )
  }
  if (!password || password.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 })
  }

  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE username = $1', [normalized])
  if (rowCount > 0) {
    throw Object.assign(new Error('Username already taken'), { status: 409 })
  }

  const normalizedEmail = email?.trim().toLowerCase() || null
  if (normalizedEmail) {
    const { rowCount: emailTaken } = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [normalizedEmail],
    )
    if (emailTaken > 0) {
      throw Object.assign(new Error('Email already registered'), { status: 409 })
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role, email, operational_status)
     VALUES ($1, $2, 'citizen', $3, 'none')
     RETURNING id, username, email, display_name, role, operational_status, preferred_lang`,
    [normalized, passwordHash, normalizedEmail],
  )

  const user = rows[0]
  const token = signToken(user)
  return {
    token,
    role: user.role,
    username: user.username,
    expiresIn: env.jwtExpiresIn,
  }
}

export async function loginUser(username, password) {
  const normalized = username.trim().toLowerCase()
  const { rows } = await pool.query(
    'SELECT id, username, password_hash, role, operational_status FROM users WHERE username = $1',
    [normalized],
  )

  const user = rows[0]
  if (!user?.password_hash) return null

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  const token = signToken(user)
  return {
    token,
    role: user.role,
    username: user.username,
    expiresIn: env.jwtExpiresIn,
  }
}

export async function getUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role, operational_status, preferred_lang
     FROM users WHERE id = $1`,
    [id],
  )
  return mapUserRow(rows[0])
}

async function findUserByFirebaseUid(uid) {
  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role, operational_status, preferred_lang, firebase_uid
     FROM users WHERE firebase_uid = $1`,
    [uid],
  )
  return rows[0] ?? null
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role, operational_status, preferred_lang, firebase_uid
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  )
  return rows[0] ?? null
}

function isBootstrapAdmin(email) {
  return env.firebaseBootstrapAdminEmails.includes(email?.toLowerCase())
}

async function generateUsername(email, uid) {
  const base = (email?.split('@')[0] || 'user')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 40) || `user_${uid.slice(0, 8)}`

  let candidate = base
  for (let i = 0; i < 20; i++) {
    const { rowCount } = await pool.query('SELECT 1 FROM users WHERE username = $1', [candidate])
    if (rowCount === 0) return candidate
    candidate = `${base}_${uid.slice(0, 6)}${i ? i : ''}`.slice(0, 50)
  }
  return `user_${uid.slice(0, 12)}`
}

async function createFirebaseUser({ uid, email, displayName, role, operationalStatus }) {
  const username = await generateUsername(email, uid)
  const { rows } = await pool.query(
    `INSERT INTO users (firebase_uid, email, display_name, username, role, operational_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email, display_name, role, operational_status, preferred_lang`,
    [uid, email.toLowerCase(), displayName || null, username, role, operationalStatus],
  )
  return rows[0]
}

async function linkFirebaseUser(existing, { uid, email, displayName }) {
  const { rows } = await pool.query(
    `UPDATE users SET
       firebase_uid = COALESCE(firebase_uid, $2),
       email = COALESCE(email, $3),
       display_name = COALESCE(display_name, $4)
     WHERE id = $1
     RETURNING id, username, email, display_name, role, operational_status, preferred_lang`,
    [existing.id, uid, email?.toLowerCase(), displayName || null],
  )
  return rows[0]
}

async function upsertFirebaseUser(decoded) {
  const uid = decoded.uid
  const email = decoded.email?.toLowerCase()
  if (!email) {
    throw Object.assign(new Error('Firebase account must have an email address'), { status: 400 })
  }

  let user = await findUserByFirebaseUid(uid)
  if (!user && email) {
    user = await findUserByEmail(email)
    if (user) {
      user = await linkFirebaseUser(user, { uid, email, displayName: decoded.name })
    }
  }

  if (!user) {
    const role = isBootstrapAdmin(email) ? 'admin' : 'citizen'
    const operationalStatus = role === 'admin' ? 'approved' : 'none'
    user = await createFirebaseUser({
      uid,
      email,
      displayName: decoded.name,
      role,
      operationalStatus,
    })
    if (role === 'admin') {
      await setFirebaseCustomClaims(uid, { role: 'admin', operational: true })
    }
  } else if (isBootstrapAdmin(email) && user.role !== 'admin') {
    const { rows } = await pool.query(
      `UPDATE users SET role = 'admin', operational_status = 'approved'
       WHERE id = $1
       RETURNING id, username, email, display_name, role, operational_status, preferred_lang, firebase_uid`,
      [user.id],
    )
    user = rows[0] ?? user
    if (user.firebase_uid) {
      await setFirebaseCustomClaims(user.firebase_uid, { role: 'admin', operational: true })
    }
  }

  return user
}

function canAccessOperational(user) {
  return OPERATIONAL_ROLES.includes(user.role)
    && (user.role === 'admin' || user.operational_status === 'approved')
}

export async function authenticateWithFirebase(idToken, loginType) {
  if (!isFirebaseReady()) {
    throw Object.assign(new Error('Firebase authentication is not configured'), { status: 503 })
  }

  const decoded = await verifyFirebaseToken(idToken)
  const user = await upsertFirebaseUser(decoded)

  if (loginType === 'operational') {
    if (!canAccessOperational(user)) {
      const msg = user.operational_status === 'pending'
        ? 'Your operational access request is pending approval.'
        : 'You do not have operational access. Apply via the Citizen Portal first.'
      throw Object.assign(new Error(msg), { status: 403 })
    }
  }

  const token = signToken(user)
  const redirect = loginType === 'citizen' ? '/citizen' : '/dashboard'

  return {
    token,
    role: user.role,
    email: user.email,
    displayName: user.display_name,
    operationalStatus: user.operational_status,
    redirect,
    expiresIn: env.jwtExpiresIn,
  }
}

export async function requestOperationalAccess(userId, reason) {
  const user = await getUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
  if (OPERATIONAL_ROLES.includes(user.role) && user.operationalStatus === 'approved') {
    throw Object.assign(new Error('You already have operational access'), { status: 400 })
  }

  const { rows: pending } = await pool.query(
    `SELECT id FROM operational_access_requests
     WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
    [userId],
  )
  if (pending.length) {
    throw Object.assign(new Error('You already have a pending request'), { status: 400 })
  }

  await pool.query(
    `UPDATE users SET operational_status = 'pending' WHERE id = $1`,
    [userId],
  )

  const { rows } = await pool.query(
    `INSERT INTO operational_access_requests (user_id, reason)
     VALUES ($1, $2)
     RETURNING id, user_id AS "userId", reason, status, created_at AS "createdAt"`,
    [userId, reason || null],
  )
  return rows[0]
}

export async function listAccessRequests({ status = 'pending' } = {}) {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.reason, r.status, r.created_at AS "createdAt",
       r.reviewed_at AS "reviewedAt", r.review_notes AS "reviewNotes",
       u.id AS "userId", u.email, u.display_name AS "displayName", u.role,
       u.operational_status AS "operationalStatus",
       rev.email AS "reviewerEmail"
     FROM operational_access_requests r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN users rev ON rev.id = r.reviewed_by
     WHERE ($1::text IS NULL OR r.status = $1)
     ORDER BY r.created_at DESC`,
    [status || null],
  )
  return rows
}

export async function reviewAccessRequest(requestId, reviewerId, { approve, notes } = {}) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: reqRows } = await client.query(
      `SELECT r.*, u.firebase_uid, u.email
       FROM operational_access_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 FOR UPDATE`,
      [requestId],
    )
    const request = reqRows[0]
    if (!request) throw Object.assign(new Error('Request not found'), { status: 404 })
    if (request.status !== 'pending') {
      throw Object.assign(new Error('Request already reviewed'), { status: 400 })
    }

    const newStatus = approve ? 'approved' : 'rejected'
    const newRole = approve ? 'operator' : 'citizen'
    const opStatus = approve ? 'approved' : 'rejected'

    await client.query(
      `UPDATE operational_access_requests
       SET status = $2, reviewed_by = $3, reviewed_at = NOW(), review_notes = $4
       WHERE id = $1`,
      [requestId, newStatus, reviewerId, notes || null],
    )

    await client.query(
      `UPDATE users SET role = $2, operational_status = $3 WHERE id = $1`,
      [request.user_id, newRole, opStatus],
    )

    if (request.firebase_uid) {
      await setFirebaseCustomClaims(request.firebase_uid, {
        role: newRole,
        operational: approve,
      })
    }

    await client.query('COMMIT')

    return { ok: true, status: newStatus, userId: request.user_id, role: newRole }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export function getAuthMode() {
  return {
    firebaseEnabled: isFirebaseReady(),
    legacyLoginEnabled: env.legacyLoginEnabled || !isFirebaseReady(),
  }
}

export default {
  registerCitizen,
  loginUser,
  getUserById,
  authenticateWithFirebase,
  requestOperationalAccess,
  listAccessRequests,
  reviewAccessRequest,
  getAuthMode,
  canAccessOperational,
}
