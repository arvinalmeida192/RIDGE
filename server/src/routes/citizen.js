import { Router } from 'express'
import * as citizenController from '../controllers/citizenController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/alerts', citizenController.getCitizenAlerts)
router.get('/subscriptions', authenticate, citizenController.getSubscriptions)
router.get('/evacuation', citizenController.getEvacuationInfo)
router.get('/contacts', citizenController.getEmergencyContacts)
router.post('/subscribe', authenticate, citizenController.subscribe)
router.post('/unsubscribe', authenticate, citizenController.unsubscribe)

export default router
