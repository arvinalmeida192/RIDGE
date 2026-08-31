import { Router } from 'express'
import * as analyticsController from '../controllers/analyticsController.js'

const router = Router()

router.get('/dashboard-stats', analyticsController.dashboardStats)
router.get('/risk-distribution', analyticsController.riskDistribution)
router.get('/rainfall-correlation', analyticsController.rainfallCorrelation)
router.get('/seasonal-heatmap', analyticsController.seasonalHeatmap)

export default router
