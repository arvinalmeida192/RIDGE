import { computeScenario } from '../services/scenarioService.js'

export async function compute(req, res, next) {
  try {
    const {
      rainfallMm = 0,
      earthquakeMagnitude = 0,
      soilMoisturePercent = 0,
      groundMovementMm = 0,
    } = req.body

    const results = await computeScenario({
      rainfallMm: Number(rainfallMm),
      earthquakeMagnitude: Number(earthquakeMagnitude),
      soilMoisturePercent: Number(soilMoisturePercent),
      groundMovementMm: Number(groundMovementMm),
    })

    res.json(results)
  } catch (err) {
    next(err)
  }
}
