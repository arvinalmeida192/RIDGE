import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as alertService from '../services/alertService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../../locales')

function loadLocale(lang) {
  try {
    return JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'))
  } catch {
    return JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))
  }
}

const router = Router()

router.get('/alert-feed', async (req, res, next) => {
  try {
    const alerts = await alertService.getAlertFeed(10)
    res.render('partials/alert-feed', { alerts, layout: false })
  } catch (err) {
    next(err)
  }
})

router.get('/citizen-alerts', async (req, res, next) => {
  try {
    const alerts = await alertService.getCitizenAlerts(req.query.zone_id)
    const locale = loadLocale(req.query.lang || 'en')
    res.render('partials/citizen-alerts', { alerts, locale, layout: false })
  } catch (err) {
    next(err)
  }
})

router.get('/alert-list', async (req, res, next) => {
  try {
    const alerts = await alertService.getAllAlerts({
      state: req.query.state || undefined,
      tier: req.query.tier || undefined,
      active: req.query.active ?? 'true',
    })
    res.render('partials/alert-list', { alerts, layout: false })
  } catch (err) {
    next(err)
  }
})

router.get('/zone-card/:id', async (req, res, next) => {
  try {
    const { getZoneById } = await import('../services/zoneService.js')
    const zone = await getZoneById(req.params.id)
    if (!zone) return res.status(404).send('Not found')
    res.render('partials/zone-card', { zone, layout: false })
  } catch (err) {
    next(err)
  }
})

export default router
