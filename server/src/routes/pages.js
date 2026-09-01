import { Router } from 'express'
import * as pages from '../controllers/pagesController.js'
import { pageAuth, optionalPageAuth, pageRequireRole, pageRequireOperational } from '../middleware/pageAuth.js'
import * as authService from '../services/authService.js'

const router = Router()

router.get('/login', pages.showLogin)
router.get('/citizen/login', pages.showCitizenLogin)
router.post('/login', pages.handleLogin)
router.post('/citizen/signup', pages.handleCitizenSignup)
router.get('/logout', pages.handleLogout)

router.get('/', optionalPageAuth, pages.showLanding)
router.get('/dashboard', pageAuth, pageRequireOperational, pages.showDashboard)
router.get('/zones/:id', pageAuth, pageRequireOperational, pages.showZoneDetail)
router.get('/alerts', pageAuth, pageRequireOperational, pages.showAlerts)
router.get('/analytics', pageAuth, pageRequireOperational, pages.showAnalytics)
router.get('/admin', pageAuth, pageRequireRole('admin', 'operator'), pages.showAdmin)
router.get('/citizen', pageAuth, pages.showCitizen)
router.get('/citizen/alerts', pageAuth, pages.showCitizenAlerts)
router.get('/citizen/safety', pageAuth, pages.showCitizenSafety)
router.get('/citizen/subscribe', pageAuth, pages.showCitizenSubscribe)
router.get('/citizen/news', pageAuth, pages.showCitizenNews)
router.get('/citizen/info', pageAuth, pages.showCitizenInfo)
router.get('/citizen/access', pageAuth, pages.showCitizenAccess)
router.get('/news', pageAuth, pageRequireOperational, pages.showNews)

export default router
