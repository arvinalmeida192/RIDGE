import * as zoneService from '../services/zoneService.js'

export async function listZones(req, res, next) {
  try {
    const zones = await zoneService.getAllZones({ state: req.query.state })
    res.json(zones)
  } catch (err) {
    next(err)
  }
}

export async function getZoneForecast(req, res, next) {
  try {
    const zone = await zoneService.getZoneById(req.params.id)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    const trajectory = await zoneService.getZoneForecast(req.params.id)
    res.json({ zoneId: req.params.id, trajectory })
  } catch (err) {
    next(err)
  }
}

export async function getMapData(req, res, next) {
  try {
    const data = await zoneService.getMapData()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function getZone(req, res, next) {
  try {
    const zone = await zoneService.getZoneById(req.params.id)
    if (!zone) return res.status(404).json({ error: 'Zone not found' })
    res.json(zone)
  } catch (err) {
    next(err)
  }
}
