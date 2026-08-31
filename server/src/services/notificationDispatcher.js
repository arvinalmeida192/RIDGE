import { pool } from '../config/database.js'
import env from '../config/env.js'
import logger from '../config/logger.js'
import { broadcast } from './sseHub.js'

async function logNotification(alertId, channel, recipient, status) {
  await pool.query(
    `INSERT INTO notification_log (alert_id, channel, recipient, status)
     VALUES ($1, $2, $3, $4)`,
    [alertId, channel, recipient, status],
  )
}

async function sendSms(phone, message) {
  if (!env.msg91ApiKey) {
    logger.info('SMS simulated (no MSG91_API_KEY)', { phone, message: message.slice(0, 80) })
    return { ok: true, simulated: true }
  }

  const url = `https://api.msg91.com/api/v2/sendsms`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: env.msg91ApiKey,
    },
    body: JSON.stringify({
      sender: env.msg91SenderId,
      route: '4',
      country: '91',
      sms: [{ message, to: [phone.replace(/^\+/, '')] }],
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MSG91 HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return { ok: true }
}

async function sendEmail(to, subject, body) {
  if (!env.smtpEnabled) {
    logger.info('Email simulated', { to, subject })
    return { ok: true, simulated: true }
  }
  // Production: wire nodemailer or external API
  logger.info('Email dispatch', { to, subject })
  return { ok: true }
}

export async function dispatchAlertNotifications(alert, zone, tier) {
  const message = `[RIDGE ${tier}] ${zone.name}: ${alert.guidance}`

  await logNotification(alert.id, 'sse', 'dashboard', 'sent')
  broadcast('alert', {
    id: alert.id,
    zoneId: zone.id,
    zoneName: zone.name,
    tier,
    guidance: alert.guidance,
    issuedAt: alert.issuedAt,
  })

  if (tier === 'Warning') {
    const { rows: subs } = await pool.query(
      `SELECT phone FROM alert_subscriptions
       WHERE zone_id = $1 AND is_active = true`,
      [zone.id],
    )

    for (const sub of subs) {
      try {
        await sendSms(sub.phone, message)
        await logNotification(alert.id, 'sms', sub.phone, 'sent')
      } catch (err) {
        logger.warn('SMS dispatch failed', { phone: sub.phone, error: err.message })
        await logNotification(alert.id, 'sms', sub.phone, 'failed')
      }
    }
  }

  if (tier === 'Warning' || tier === 'Watch') {
    const authorityEmail = env.authorityAlertEmail
    if (authorityEmail) {
      try {
        await sendEmail(
          authorityEmail,
          `RIDGE ${tier}: ${zone.name}`,
          `${message}\n\nRisk score: ${alert.riskScore}\nRadius: ${alert.affectedRadius} km`,
        )
        await logNotification(alert.id, 'email', authorityEmail, 'sent')
      } catch (err) {
        await logNotification(alert.id, 'email', authorityEmail, 'failed')
      }
    }
  }

  return { dispatched: true }
}

export async function broadcastToCitizens(zoneId, message, alertId = null) {
  const { rows: subs } = await pool.query(
    `SELECT phone FROM alert_subscriptions
     WHERE ($1::varchar IS NULL OR zone_id = $1) AND is_active = true`,
    [zoneId],
  )

  let sent = 0
  for (const sub of subs) {
    try {
      await sendSms(sub.phone, message)
      await logNotification(alertId, 'sms', sub.phone, 'sent')
      sent++
    } catch (err) {
      await logNotification(alertId, 'sms', sub.phone, 'failed')
    }
  }
  return { sent, total: subs.length }
}

export default { dispatchAlertNotifications, broadcastToCitizens, logNotification }
