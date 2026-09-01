import * as authService from '../services/authService.js'
const { loginUser, getAuthMode } = authService
import { getFirebaseWebConfig } from '../config/firebase.js'
import * as zoneService from '../services/zoneService.js'
import * as alertService from '../services/alertService.js'
import * as analyticsService from '../services/analyticsService.js'
import * as newsService from '../services/newsService.js'
import { PARAM_META } from '../services/scenarioService.js'
import { getEvacuationForZone, getEmergencyContactsList } from '../controllers/citizenController.js'
import { pool } from '../config/database.js'
import { renderPage } from '../utils/renderPage.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../../locales')

function loadLocale(lang) {
  try {
    return JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'))
  } catch {
    return JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))
  }
}

export async function showLogin(req, res, next) {
  const authMode = getAuthMode()
  renderPage(res, 'login', 'pages/login-operational', {
    title: 'Operations Login',
    error: req.query.error,
    next: req.query.next || '/dashboard',
    loginType: 'operational',
    authMode,
    firebaseConfig: getFirebaseWebConfig(),
    firebaseEmulator: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  }, next)
}

export async function showCitizenLogin(req, res, next) {
  const authMode = getAuthMode()
  renderPage(res, 'login', 'pages/login-citizen', {
    title: 'Citizen Login',
    error: req.query.error,
    mode: req.query.mode || 'signin',
    next: req.query.next || '/citizen',
    loginType: 'citizen',
    authMode,
    firebaseConfig: getFirebaseWebConfig(),
    firebaseEmulator: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  }, next)
}

export async function handleCitizenSignup(req, res) {
  const authMode = getAuthMode()
  if (!authMode.legacyLoginEnabled) {
    return res.redirect('/citizen/login?error=firebase')
  }
  try {
    const result = await authService.registerCitizen(
      req.body.username,
      req.body.password,
      req.body.email,
    )
    res.cookie('ridge_token', result.token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'lax',
    })
    res.redirect(req.body.next || '/citizen')
  } catch (err) {
    const code = err.status === 409 ? 'taken' : 'invalid'
    const next = encodeURIComponent(req.body.next || '/citizen')
    return res.redirect(`/citizen/login?error=${code}&mode=signup&next=${next}`)
  }
}

export async function handleLogin(req, res) {
  const authMode = getAuthMode()
  if (!authMode.legacyLoginEnabled) {
    return res.redirect('/login?error=firebase')
  }
  const result = await loginUser(req.body.username, req.body.password)
  if (!result) {
    const loginPath = req.body.loginType === 'citizen' ? '/citizen/login' : '/login'
    return res.redirect(`${loginPath}?error=invalid&next=` + encodeURIComponent(req.body.next || '/dashboard'))
  }
  if (req.body.loginType === 'operational' && result.role === 'citizen') {
    return res.redirect('/login?error=noaccess&next=' + encodeURIComponent(req.body.next || '/dashboard'))
  }
  res.cookie('ridge_token', result.token, {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'lax',
  })
  const dest = req.body.next || (result.role === 'citizen' ? '/citizen' : '/dashboard')
  res.redirect(dest)
}

export function handleLogout(req, res) {
  res.clearCookie('ridge_token')
  res.redirect('/')
}

export async function showLanding(req, res, next) {
  try {
    const stats = await analyticsService.getDashboardStats()
    const authMode = getAuthMode()
    renderPage(res, 'public', 'pages/landing', {
      title: 'RIDGE', stats, user: req.user, nextUrl: req.query.next, authMode,
    }, next)
  } catch (err) { next(err) }
}

export async function showDashboard(req, res, next) {
  try {
    const [stats, zones, alerts, news, riskDist, rainfall] = await Promise.all([
      analyticsService.getDashboardStats(),
      zoneService.getAllZones(),
      alertService.getAlertFeed(10),
      newsService.getNewsItems({ limit: 5 }),
      analyticsService.getRiskDistribution(),
      analyticsService.getRainfallCorrelation(),
    ])
    const mapData = await zoneService.getMapData()
    renderPage(res, 'admin', 'pages/dashboard', {
      title: 'Dashboard', user: req.user, stats, zones, alerts, news, riskDist, rainfall, mapData,
    }, next)
  } catch (err) { next(err) }
}

export async function showZoneDetail(req, res, next) {
  try {
    const zone = await zoneService.getZoneById(req.params.id)
    if (!zone) return res.status(404).send('Zone not found')
    renderPage(res, 'admin', 'pages/zone-detail', { title: zone.name, user: req.user, zone }, next)
  } catch (err) { next(err) }
}

export async function showAlerts(req, res, next) {
  try {
    const alerts = await alertService.getAllAlerts({
      state: req.query.state, tier: req.query.tier, active: req.query.active ?? 'true',
    })
    const states = [...new Set((await zoneService.getAllZones()).map((z) => z.state))]
    renderPage(res, 'admin', 'pages/alerts', {
      title: 'Alerts', user: req.user, alerts, states, filters: req.query,
    }, next)
  } catch (err) { next(err) }
}

export async function showAnalytics(req, res, next) {
  try {
    const [stats, riskDist, rainfall, seasonal] = await Promise.all([
      analyticsService.getDashboardStats(),
      analyticsService.getRiskDistribution(),
      analyticsService.getRainfallCorrelation(),
      analyticsService.getSeasonalHeatmap(),
    ])
    renderPage(res, 'admin', 'pages/analytics', {
      title: 'Analytics', user: req.user, stats, riskDist, rainfall, seasonal, scenarioParams: PARAM_META,
    }, next)
  } catch (err) { next(err) }
}

export async function showAdmin(req, res, next) {
  try {
    const [zones, health, accessRequests] = await Promise.all([
      zoneService.getAllZones(),
      pool.query('SELECT component, status, message, last_check AS "lastCheck" FROM system_health ORDER BY component'),
      authService.listAccessRequests({ status: 'pending' }),
    ])
    renderPage(res, 'admin', 'pages/admin', {
      title: 'Admin', user: req.user, zones, systemHealth: health.rows, accessRequests,
    }, next)
  } catch (err) { next(err) }
}

function setLangCookie(res, lang) {
  res.cookie('ridge_lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, sameSite: 'lax' })
}

export async function showCitizen(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const [zones, zone, alerts] = await Promise.all([
      zoneService.getAllZones(),
      zoneService.getZoneById(zoneId),
      alertService.getCitizenAlerts(zoneId),
    ])
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-home', {
      title: 'Citizen Portal', section: 'home', user: req.user,
      zone, zones, alerts, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenAlerts(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const [zone, alerts] = await Promise.all([
      zoneService.getZoneById(zoneId),
      alertService.getCitizenAlerts(zoneId),
    ])
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-alerts', {
      title: 'Citizen Portal', section: 'alerts', user: req.user,
      zone, alerts, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenSafety(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const zone = await zoneService.getZoneById(zoneId)
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-safety', {
      title: 'Citizen Portal', section: 'safety', user: req.user,
      zone, evacuation: getEvacuationForZone(zoneId), contacts: getEmergencyContactsList(),
      lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenSubscribe(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const [zone, subscriptions] = await Promise.all([
      zoneService.getZoneById(zoneId),
      alertService.getSubscriptionsForZone(zoneId, req.user?.sub ?? null),
    ])
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-subscribe', {
      title: 'Citizen Portal', section: 'subscribe', user: req.user,
      zone, subscriptions, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenNews(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const zone = await zoneService.getZoneById(zoneId)
    const news = await newsService.getNewsItems({ state: zone?.state, limit: 20 })
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-news', {
      title: 'Citizen Portal', section: 'news', user: req.user,
      zone, news, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenInfo(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const zone = await zoneService.getZoneById(zoneId)
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-info', {
      title: 'Citizen Portal', section: 'info', user: req.user,
      zone, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenAccess(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const zone = await zoneService.getZoneById(zoneId)
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    const dbUser = req.user?.sub ? await authService.getUserById(req.user.sub) : null
    renderPage(res, 'citizen', 'pages/citizen-access', {
      title: 'Citizen Portal', section: 'access', user: req.user,
      dbUser, zone, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenZones(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zoneId = req.query.zone || 'z01'
    const [zones, zone, mapData] = await Promise.all([
      zoneService.getAllZones(),
      zoneService.getZoneById(zoneId),
      zoneService.getMapData(),
    ])
    const zoneQuery = `?zone=${zoneId}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-zones', {
      title: 'Citizen Portal', section: 'zones', user: req.user,
      zones, zone, mapData, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showCitizenZoneDetail(req, res, next) {
  try {
    const lang = req.query.lang || req.cookies?.ridge_lang || 'en'
    if (req.query.lang) setLangCookie(res, lang)
    const locale = loadLocale(lang)
    const zone = await zoneService.getZoneById(req.params.id)
    if (!zone) return res.status(404).send('Zone not found')
    const zoneQuery = `?zone=${zone.id}&lang=${lang}`
    renderPage(res, 'citizen', 'pages/citizen-zone-detail', {
      title: 'Citizen Portal', section: 'zones', user: req.user,
      zone, lang, locale, zoneQuery,
    }, next)
  } catch (err) { next(err) }
}

export async function showNews(req, res, next) {
  try {
    const news = await newsService.getNewsItems({ state: req.query.state })
    renderPage(res, 'admin', 'pages/news', { title: 'News', user: req.user, news }, next)
  } catch (err) { next(err) }
}
