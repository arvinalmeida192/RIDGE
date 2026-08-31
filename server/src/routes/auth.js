import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/config', authController.authConfig)
router.post('/login', authController.login)
router.post('/firebase', authController.firebaseAuth)
router.post('/firebase-session', authController.firebaseSession)
router.get('/me', authenticate, authController.me)
router.post('/request-operational', authenticate, authController.requestOperational)
router.get('/access-requests', authenticate, requireRole('admin', 'operator'), authController.listRequests)
router.post('/access-requests/:id/review', authenticate, requireRole('admin', 'operator'), authController.reviewRequest)

export default router
