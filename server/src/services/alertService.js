import { pool } from '../config/database.js'

export async function getAllAlerts({ state, tier, active = true, limit } = {}) {
  const params = []
  const conditions = []

  if (active !== undefined && active !== 'false') {
    conditions.push('a.is_active = true')
  }
  if (state) {
    params.push(state)
    conditions.push(`z.state = $${params.length}`)
  }
  if (tier) {
    params.push(tier)
    conditions.push(`a.tier = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const limitClause = limit ? `LIMIT ${parseInt(limit, 10)}` : ''

  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.zone_id AS "zoneId",
       z.name AS "zoneName",
       z.state,
       a.tier,
       a.risk_level AS "riskLevel",
       a.risk_score AS "riskScore",
       a.issued_at AS "issuedAt",
       a.resolved_at AS "resolvedAt",
       a.affected_radius AS "affectedRadius",
       a.guidance,
       a.is_active AS "isActive"
     FROM alerts a
     JOIN zones z ON z.id = a.zone_id
     ${where}
     ORDER BY a.issued_at DESC
     ${limitClause}`,
    params,
  )

  return rows
}

export async function getAlertById(id) {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.zone_id AS "zoneId",
       z.name AS "zoneName",
       z.state,
       a.tier,
       a.risk_level AS "riskLevel",
       a.risk_score AS "riskScore",
       a.issued_at AS "issuedAt",
       a.resolved_at AS "resolvedAt",
       a.affected_radius AS "affectedRadius",
       a.guidance,
       a.is_active AS "isActive"
     FROM alerts a
     JOIN zones z ON z.id = a.zone_id
     WHERE a.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function acknowledgeAlert(alertId, userId) {
  await pool.query(
    `INSERT INTO alert_acknowledgments (alert_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (alert_id, user_id) DO NOTHING`,
    [alertId, userId],
  )
  return { ok: true, alertId, userId }
}

export async function getAlertFeed(limit = 10) {
  return getAllAlerts({ active: true, limit })
}

export async function getNotificationLog(alertId) {
  const { rows } = await pool.query(
    `SELECT channel, recipient, status, sent_at AS "sentAt"
     FROM notification_log WHERE alert_id = $1 ORDER BY sent_at DESC`,
    [alertId],
  )
  return rows
}

export async function getSubscriptionsForZone(zoneId, userId = null) {
  const params = [zoneId]
  let where = 'WHERE zone_id = $1 AND is_active = true'
  if (userId) {
    params.push(userId)
    where += ` AND user_id = $${params.length}`
  }
  const { rows } = await pool.query(
    `SELECT id, zone_id AS "zoneId", phone, is_active AS "isActive", created_at AS "createdAt"
     FROM alert_subscriptions ${where}
     ORDER BY created_at DESC`,
    params,
  )
  return rows
}

export async function subscribeToZone(zoneId, phone, userId = null) {
  const { rows } = await pool.query(
    `INSERT INTO alert_subscriptions (zone_id, phone, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (zone_id, phone) DO UPDATE SET is_active = true, user_id = COALESCE($3, alert_subscriptions.user_id)
     RETURNING id, zone_id AS "zoneId", phone, is_active AS "isActive"`,
    [zoneId, phone, userId],
  )
  return rows[0]
}

export async function unsubscribeFromZone(zoneId, phone) {
  await pool.query(
    `UPDATE alert_subscriptions SET is_active = false
     WHERE zone_id = $1 AND phone = $2`,
    [zoneId, phone],
  )
  return { ok: true }
}

export async function getCitizenAlerts(zoneId) {
  const params = []
  let where = 'WHERE a.is_active = true'
  if (zoneId) {
    params.push(zoneId)
    where += ` AND a.zone_id = $${params.length}`
  }

  const { rows } = await pool.query(
    `SELECT
       a.id, a.zone_id AS "zoneId", z.name AS "zoneName", z.state,
       a.tier, a.risk_level AS "riskLevel", a.risk_score AS "riskScore",
       a.issued_at AS "issuedAt", a.affected_radius AS "affectedRadius", a.guidance
     FROM alerts a
     JOIN zones z ON z.id = a.zone_id
     ${where}
     ORDER BY a.issued_at DESC`,
    params,
  )
  return rows
}

export default {
  getAllAlerts,
  getAlertById,
  acknowledgeAlert,
  getAlertFeed,
  getNotificationLog,
  subscribeToZone,
  unsubscribeFromZone,
  getSubscriptionsForZone,
  getCitizenAlerts,
}
