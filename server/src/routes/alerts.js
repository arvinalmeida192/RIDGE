import { Router } from 'express'
import * as alertsController from '../controllers/alertsController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/feed', alertsController.getAlertFeed)
router.post('/broadcast', authenticate, requireRole('admin'), alertsController.broadcastAlert)
router.get('/', alertsController.listAlerts)
router.post('/:id/acknowledge', authenticate, alertsController.acknowledgeAlert)
router.post('/:id/notify', authenticate, requireRole('admin'), alertsController.notifyAuthorities)
router.get('/:id', alertsController.getAlert)

export default router
