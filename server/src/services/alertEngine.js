import { pool } from '../config/database.js'
import logger from '../config/logger.js'
import env from '../config/env.js'
import { updateZoneExposureCache } from './exposure.js'
import { dispatchAlertNotifications } from './notificationDispatcher.js'
import { updateSystemHealth } from './ingestionTracker.js'
import {
  ALERT_RULES,
  matchingRule,
  shouldEscalate,
  shouldDeescalate,
  buildGuidance,
} from './alertRules.js'

async function nextAlertId() {
  const { rows } = await pool.query(
    `SELECT id FROM alerts WHERE id ~ '^a[0-9]+$' ORDER BY CAST(SUBSTRING(id FROM 2) AS INTEGER) DESC LIMIT 1`,
  )
  const num = rows[0] ? parseInt(rows[0].id.slice(1), 10) + 1 : 1
  return `a${String(num).padStart(2, '0')}`
}

async function getActiveAlert(zoneId) {
  const { rows } = await pool.query(
    `SELECT id, zone_id AS "zoneId", tier, risk_level AS "riskLevel",
            risk_score AS "riskScore", issued_at AS "issuedAt",
            affected_radius AS "affectedRadius", guidance, is_active AS "isActive"
     FROM alerts
     WHERE zone_id = $1 AND is_active = true
     ORDER BY issued_at DESC LIMIT 1`,
    [zoneId],
  )
  return rows[0] ?? null
}

async function getRiskTrend6h(zoneId) {
  const { rows } = await pool.query(
    `SELECT risk_score FROM risk_scores
     WHERE zone_id = $1 AND time >= NOW() - INTERVAL '6 hours'
     ORDER BY time ASC`,
    [zoneId],
  )
  if (rows.length < 2) return 0
  return rows[rows.length - 1].risk_score - rows[0].risk_score
}

async function getZonesForEvaluation() {
  const { rows } = await pool.query(
    `SELECT
       z.id, z.name, z.state, z.lat, z.lng,
       rs.risk_score, rs.risk_level, rs.active_triggers
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT * FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) rs ON true
     WHERE z.is_active = true
     ORDER BY z.id`,
  )

  const zones = []
  for (const row of rows) {
    const activeTriggers = Array.isArray(row.active_triggers)
      ? row.active_triggers
      : (typeof row.active_triggers === 'string' ? JSON.parse(row.active_triggers) : [])

    zones.push({
      id: row.id,
      name: row.name,
      state: row.state,
      lat: row.lat,
      lng: row.lng,
      risk_score: row.risk_score ?? 1,
      risk_level: row.risk_level ?? 'Low',
      active_triggers: activeTriggers,
      risk_trend_6h: await getRiskTrend6h(row.id),
    })
  }
  return zones
}

async function createAlert(zone, rule, exposure) {
  const id = await nextAlertId()
  const radius = rule.affectedRadiusKm(zone)
  const guidance = buildGuidance(rule.tier, zone, exposure)
  const issuedAt = new Date()

  await pool.query(
    `INSERT INTO alerts
       (id, zone_id, tier, risk_level, risk_score, issued_at, affected_radius, guidance, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [id, zone.id, rule.tier, zone.risk_level, zone.risk_score, issuedAt, radius, guidance],
  )

  const alert = {
    id,
    zoneId: zone.id,
    tier: rule.tier,
    riskLevel: zone.risk_level,
    riskScore: zone.risk_score,
    issuedAt,
    affectedRadius: radius,
    guidance,
    isActive: true,
  }

  if (env.notificationsEnabled) {
    await dispatchAlertNotifications(alert, zone, rule.tier)
  }

  logger.info(`Alert created: ${id} ${rule.tier} for ${zone.id}`, {
    riskScore: zone.risk_score,
    radius,
  })

  return alert
}

async function resolveAlert(alert, reason = 'de-escalated') {
  await pool.query(
    `UPDATE alerts SET is_active = false, resolved_at = NOW() WHERE id = $1`,
    [alert.id],
  )
  await pool.query(
    `INSERT INTO notification_log (alert_id, channel, recipient, status)
     VALUES ($1, 'system', 'alert_engine', $2)`,
    [alert.id, reason],
  )
  logger.info(`Alert resolved: ${alert.id} (${reason})`)
}

async function updateAlertTier(alert, zone, rule, exposure) {
  const radius = rule.affectedRadiusKm(zone)
  const guidance = buildGuidance(rule.tier, zone, exposure)

  await pool.query(
    `UPDATE alerts SET
       tier = $2, risk_level = $3, risk_score = $4,
       affected_radius = $5, guidance = $6, issued_at = NOW()
     WHERE id = $1`,
    [alert.id, rule.tier, zone.risk_level, zone.risk_score, radius, guidance],
  )

  const updated = {
    ...alert,
    tier: rule.tier,
    riskLevel: zone.risk_level,
    riskScore: zone.risk_score,
    affectedRadius: radius,
    guidance,
    issuedAt: new Date(),
  }

  if (env.notificationsEnabled) {
    await dispatchAlertNotifications(updated, zone, rule.tier)
  }

  return updated
}

async function recentNotificationExists(alertId, tier, cooldownMin) {
  const { rows } = await pool.query(
    `SELECT 1 FROM notification_log
     WHERE alert_id = $1 AND status = 'sent'
       AND sent_at > NOW() - ($2 || ' minutes')::interval
     LIMIT 1`,
    [alertId, cooldownMin],
  )
  return rows.length > 0
}

export async function evaluateAlerts() {
  const zones = await getZonesForEvaluation()
  let created = 0
  let resolved = 0
  let escalated = 0

  for (const zone of zones) {
    const currentAlert = await getActiveAlert(zone.id)
    const rule = matchingRule(zone)

    if (rule) {
      const radius = rule.affectedRadiusKm(zone)
      await updateZoneExposureCache(zone.id, radius, zone.risk_level)
      const { rows: expRows } = await pool.query(
        'SELECT exposure_details FROM zone_exposure WHERE zone_id = $1',
        [zone.id],
      )
      const exposure = expRows[0]?.exposure_details ?? {}

      if (!currentAlert) {
        await createAlert(zone, rule, exposure)
        created++
      } else if (shouldEscalate(currentAlert, rule.tier)) {
        const cooldown = env.alertCooldownMin
        const skip = currentAlert.tier === rule.tier &&
          await recentNotificationExists(currentAlert.id, rule.tier, cooldown)
        if (!skip) {
          await updateAlertTier(currentAlert, zone, rule, exposure)
          escalated++
        }
      } else if (currentAlert.tier !== rule.tier) {
        await updateAlertTier(currentAlert, zone, rule, exposure)
        escalated++
      }
      continue
    }

    if (currentAlert && shouldDeescalate(currentAlert, zone)) {
      await resolveAlert(currentAlert)
      resolved++
    }
  }

  await updateSystemHealth(
    'alert_engine',
    'operational',
    `Evaluated ${zones.length} zones: ${created} created, ${escalated} escalated, ${resolved} resolved`,
  )

  return {
    recordsProcessed: zones.length,
    metadata: { created, escalated, resolved },
  }
}

export default { evaluateAlerts, ALERT_RULES }
