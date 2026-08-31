import { zones, getZoneExposure } from '../data/mockData'
import type { Zone } from '../data/mockData'
import type { RiskLevel } from './riskColors'
import { riskFromScore } from './riskColors'

export interface ScenarioConditions {
  rainfallMm: number
  earthquakeMagnitude: number
  soilMoisturePercent: number
  groundMovementMm: number
}

export const SCENARIO_PARAM_META = [
  {
    key: 'rainfallMm' as const,
    label: 'Rainfall',
    icon: '🌧️',
    unit: 'mm',
    min: 0,
    max: 300,
    step: 5,
    defaultValue: 100,
    formatValue: (v: number) => `+${v}mm rainfall`,
  },
  {
    key: 'earthquakeMagnitude' as const,
    label: 'Earthquake',
    icon: '🫨',
    unit: 'M',
    min: 0,
    max: 7,
    step: 0.1,
    defaultValue: 5.2,
    formatValue: (v: number) => `Earthquake M${v.toFixed(1)}`,
  },
  {
    key: 'soilMoisturePercent' as const,
    label: 'Soil Moisture',
    icon: '💧',
    unit: '%',
    min: 0,
    max: 50,
    step: 1,
    defaultValue: 20,
    formatValue: (v: number) => `+${v}% soil moisture`,
  },
  {
    key: 'groundMovementMm' as const,
    label: 'Ground Movement',
    icon: '📐',
    unit: 'mm',
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 10,
    formatValue: (v: number) => `+${v}mm ground movement`,
  },
] as const

export const DEFAULT_CONDITIONS: ScenarioConditions = {
  rainfallMm: 0,
  earthquakeMagnitude: 0,
  soilMoisturePercent: 0,
  groundMovementMm: 0,
}

export interface ScenarioZoneResult {
  zone: Zone
  riskScore: number
  riskLevel: RiskLevel
  scoreDelta: number
  escalated: boolean
}

export interface ScenarioResults {
  baselineHighRisk: number
  simulatedHighRisk: number
  baselineElevated: number
  simulatedElevated: number
  newlyHighRisk: ScenarioZoneResult[]
  escalatedZones: ScenarioZoneResult[]
  populationAtRisk: number
  populationDelta: number
  activeConditions: string[]
  simulated: ScenarioZoneResult[]
  baseline: ScenarioZoneResult[]
  regionalTier: RiskLevel
}

export function isHighRisk(level: RiskLevel): boolean {
  return level === 'High' || level === 'Very High' || level === 'Critical'
}

export function isElevatedRisk(score: number): boolean {
  return score >= 2.5
}

export function formatActiveConditions(conditions: ScenarioConditions): string[] {
  const labels: string[] = []

  for (const meta of SCENARIO_PARAM_META) {
    const value = conditions[meta.key]
    if (value > 0) labels.push(meta.formatValue(value))
  }

  return labels
}

function computeZoneScenario(zone: Zone, conditions: ScenarioConditions): ScenarioZoneResult {
  let score = zone.riskScore
  let rainfall = zone.rainfall24h
  let soil = zone.soilSaturation
  let movement = zone.groundMovement

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
    zone,
    riskScore: score,
    riskLevel,
    scoreDelta: Math.round((score - zone.riskScore) * 10) / 10,
    escalated: riskFromScore(score) !== zone.riskLevel && score > zone.riskScore,
  }
}

export function hasActiveConditions(conditions: ScenarioConditions): boolean {
  return (
    conditions.rainfallMm > 0
    || conditions.earthquakeMagnitude > 0
    || conditions.soilMoisturePercent > 0
    || conditions.groundMovementMm > 0
  )
}

export function computeScenarioResults(conditions: ScenarioConditions): ScenarioResults {
  const baseline: ScenarioZoneResult[] = zones.map((z) => ({
    zone: z,
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
    (s) => isHighRisk(s.riskLevel) && !isHighRisk(s.zone.riskLevel),
  )

  const escalatedZones = simulated.filter((s) => s.escalated)

  const popBaseline = baseline
    .filter((b) => isElevatedRisk(b.riskScore))
    .reduce((sum, b) => sum + (getZoneExposure(b.zone.id)?.estimatedPopulationInRadius ?? 0), 0)

  const popSimulated = simulated
    .filter((s) => isElevatedRisk(s.riskScore))
    .reduce((sum, s) => sum + (getZoneExposure(s.zone.id)?.estimatedPopulationInRadius ?? 0), 0)

  const activeConditions = formatActiveConditions(conditions)

  const avgScore = simulated.reduce((s, z) => s + z.riskScore, 0) / simulated.length
  let regionalTier: RiskLevel = 'Low'
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
    escalatedZones,
    populationAtRisk: popSimulated,
    populationDelta: popSimulated - popBaseline,
    activeConditions,
    simulated,
    baseline,
    regionalTier,
  }
}
