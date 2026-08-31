import { pool } from '../config/database.js'
import { riskFromScore } from '../utils/riskUtils.js'

const PARAM_META = [
  { key: 'rainfallMm', label: 'Rainfall', unit: 'mm', min: 0, max: 300, step: 5, defaultValue: 100 },
  { key: 'earthquakeMagnitude', label: 'Earthquake', unit: 'M', min: 0, max: 7, step: 0.1, defaultValue: 5.2 },
  { key: 'soilMoisturePercent', label: 'Soil Moisture', unit: '%', min: 0, max: 50, step: 1, defaultValue: 20 },
  { key: 'groundMovementMm', label: 'Ground Movement', unit: 'mm', min: 0, max: 30, step: 1, defaultValue: 10 },
]

function isHighRisk(level) {
  return ['High', 'Very High', 'Critical'].includes(level)
}

function isElevatedRisk(score) {
  return score >= 2.5
}

async function getZonesWithExposure() {
  const { rows } = await pool.query(
    `SELECT
       z.id, z.name, z.state, z.lat, z.lng,
       rs.risk_score, rs.risk_level,
       sr.rainfall_24h, sr.soil_saturation, sr.ground_movement,
       zsa.seismic_index,
       ze.estimated_population_in_radius AS population
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT * FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) rs ON true
     LEFT JOIN LATERAL (
       SELECT rainfall_24h, soil_saturation, ground_movement
       FROM sensor_readings WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) sr ON true
     LEFT JOIN zone_static_attributes zsa ON zsa.zone_id = z.id
     LEFT JOIN zone_exposure ze ON ze.zone_id = z.id
     WHERE z.is_active = true
     ORDER BY z.id`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    state: r.state,
    riskScore: r.risk_score ?? 1,
    riskLevel: r.risk_level ?? 'Low',
    rainfall24h: r.rainfall_24h ?? 0,
    soilSaturation: r.soil_saturation ?? 0,
    groundMovement: r.ground_movement ?? 0,
    seismicIndex: r.seismic_index ?? 0.1,
    population: r.population ?? 0,
  }))
}

function computeZoneScenario(zone, conditions) {
  let score = zone.riskScore
  let rainfall = zone.rainfall24h
  let soil = zone.soilSaturation
  let movement = zone.groundMovement ?? 0
  const { rainfallMm, earthquakeMagnitude, soilMoisturePercent, groundMovementMm } = conditions

  if (rainfallMm > 0) {
    const factor = rainfallMm / 100
    rainfall += rainfallMm
    score += (0.42 + (zone.rainfall24h / 180) * 0.55) * factor
  }
  if (earthquakeMagnitude > 0) {
    const factor = earthquakeMagnitude / 5.2
    score += (0.22 + zone.seismicIndex * 1.4) * factor
  }
  if (soilMoisturePercent > 0) {
    const factor = soilMoisturePercent / 20
    soil = Math.min(100, soil + soilMoisturePercent)
    score += (0.3 + (soil / 100) * 0.35) * factor
  }
  if (groundMovementMm > 0) {
    const factor = groundMovementMm / 10
    movement += groundMovementMm
    score += (0.35 + (movement / 18) * 0.25) * factor
  }

  const activeHydro = [rainfallMm > 0, soilMoisturePercent > 0, groundMovementMm > 0].filter(Boolean).length
  if (activeHydro >= 2) score += 0.18 * (activeHydro - 1)
  if (rainfallMm > 0 && earthquakeMagnitude > 0) {
    score += 0.12 * Math.min(rainfallMm / 100, earthquakeMagnitude / 5.2)
  }

  score = Math.min(5, Math.max(1, Math.round(score * 10) / 10))
  const riskLevel = riskFromScore(score)

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    state: zone.state,
    riskScore: score,
    riskLevel,
    scoreDelta: Math.round((score - zone.riskScore) * 10) / 10,
    escalated: riskLevel !== zone.riskLevel && score > zone.riskScore,
  }
}

export async function computeScenario(conditions) {
  const zones = await getZonesWithExposure()
  const baseline = zones.map((z) => ({
    zoneId: z.id,
    zoneName: z.name,
    riskScore: z.riskScore,
    riskLevel: z.riskLevel,
    scoreDelta: 0,
    escalated: false,
  }))

  const simulated = zones.map((z) => computeZoneScenario(z, conditions))

  const baselineHighRisk = baseline.filter((b) => isHighRisk(b.riskLevel)).length
  const simulatedHighRisk = simulated.filter((s) => isHighRisk(s.riskLevel)).length
  const baselineElevated = baseline.filter((b) => isElevatedRisk(b.riskScore)).length
  const simulatedElevated = simulated.filter((s) => isElevatedRisk(s.riskScore)).length

  const newlyHighRisk = simulated.filter(
    (s) => isHighRisk(s.riskLevel) && !isHighRisk(baseline.find((b) => b.zoneId === s.zoneId)?.riskLevel),
  )

  const popBaseline = zones
    .filter((z) => isElevatedRisk(z.riskScore))
    .reduce((sum, z) => sum + z.population, 0)

  const popSimulated = zones
    .map((z, i) => ({ ...z, sim: simulated[i] }))
    .filter((z) => isElevatedRisk(z.sim.riskScore))
    .reduce((sum, z) => sum + z.population, 0)

  const activeConditions = PARAM_META
    .filter((m) => conditions[m.key] > 0)
    .map((m) => `${m.label}: +${conditions[m.key]} ${m.unit}`)

  const avgScore = simulated.reduce((s, z) => s + z.riskScore, 0) / simulated.length
  let regionalTier = 'Low'
  if (avgScore >= 4.2 || simulatedHighRisk >= 10) regionalTier = 'Critical'
  else if (avgScore >= 3.5 || simulatedHighRisk >= 7) regionalTier = 'Very High'
  else if (avgScore >= 2.8 || simulatedHighRisk >= 5) regionalTier = 'High'
  else if (avgScore >= 2.0) regionalTier = 'Moderate'

  return {
    baselineHighRisk,
    simulatedHighRisk,
    baselineElevated,
    simulatedElevated,
    newlyHighRisk,
    escalatedZones: simulated.filter((s) => s.escalated),
    populationAtRisk: popSimulated,
    populationDelta: popSimulated - popBaseline,
    activeConditions,
    simulated,
    baseline,
    regionalTier,
  }
}

export { PARAM_META }
export default { computeScenario, PARAM_META }
