import * as alertService from '../services/alertService.js'
import { dispatchAlertNotifications, broadcastToCitizens } from '../services/notificationDispatcher.js'

export async function listAlerts(req, res, next) {
  try {
    const alerts = await alertService.getAllAlerts({
      state: req.query.state,
      tier: req.query.tier,
      active: req.query.active,
    })
    res.json(alerts)
  } catch (err) {
    next(err)
  }
}

export async function getAlert(req, res, next) {
  try {
    const alert = await alertService.getAlertById(req.params.id)
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    const notifications = await alertService.getNotificationLog(req.params.id)
    res.json({ ...alert, notifications })
  } catch (err) {
    next(err)
  }
}

export async function getAlertFeed(req, res, next) {
  try {
    const alerts = await alertService.getAlertFeed(10)
    const accept = req.headers.accept ?? ''
    if (accept.includes('text/html') || req.query.format === 'html') {
      return res.render('partials/alert-feed', { alerts, layout: false })
    }
    res.json(alerts)
  } catch (err) {
    next(err)
  }
}

export async function acknowledgeAlert(req, res, next) {
  try {
    const alert = await alertService.getAlertById(req.params.id)
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    const result = await alertService.acknowledgeAlert(req.params.id, req.user.sub)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function notifyAuthorities(req, res, next) {
  try {
    const alert = await alertService.getAlertById(req.params.id)
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    await dispatchAlertNotifications(alert, { id: alert.zoneId, name: alert.zoneName }, alert.tier)
    res.json({ ok: true, alertId: alert.id })
  } catch (err) {
    next(err)
  }
}

export async function broadcastAlert(req, res, next) {
  try {
    const { zoneId, message } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })
    const result = await broadcastToCitizens(zoneId ?? null, message)
    res.json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
}
