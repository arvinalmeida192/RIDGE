import { Router } from 'express'
import * as scenariosController from '../controllers/scenariosController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/compute', authenticate, requireRole('admin'), scenariosController.compute)

export default router
