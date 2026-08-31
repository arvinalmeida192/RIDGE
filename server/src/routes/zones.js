import { Router } from 'express'
import * as zonesController from '../controllers/zonesController.js'

import { validateZoneId } from '../middleware/validate.js'

const router = Router()

router.get('/map-data', zonesController.getMapData)
router.get('/', zonesController.listZones)
router.get('/:id/forecast', validateZoneId, zonesController.getZoneForecast)
router.get('/:id', validateZoneId, zonesController.getZone)

export default router
