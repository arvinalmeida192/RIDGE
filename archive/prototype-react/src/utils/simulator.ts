import type { Zone } from '../data/mockData'
import { getZoneExposure } from '../data/mockData'
import type { RiskLevel } from './riskColors'
import { riskFromScore } from './riskColors'

export const BASELINE_RAINFALL = 84

export interface SimulatedZone {
  zone: Zone
  riskScore: number
  riskLevel: RiskLevel
  simulatedRainfall: number
}

export function computeSimulatedZoneRisk(zone: Zone, rainfall: number): SimulatedZone {
  const rainfallNorm = (rainfall - 50) / 250
  const zoneWetness = zone.rainfall24h / 160
  const boost = rainfallNorm * 1.6 + zoneWetness * 0.35
  const riskScore = Math.min(5, Math.max(1, zone.riskScore * (0.75 + rainfallNorm * 0.5) + boost))
  return {
    zone,
    riskScore: Math.round(riskScore * 10) / 10,
    riskLevel: riskFromScore(riskScore),
    simulatedRainfall: Math.round(rainfall * (0.7 + zoneWetness * 0.3)),
  }
}

export function computeRegionalTier(rainfall: number): RiskLevel {
  if (rainfall >= 240) return 'Critical'
  if (rainfall >= 180) return 'Very High'
  if (rainfall >= 120) return 'High'
  if (rainfall >= 80) return 'Moderate'
  return 'Low'
}

export function computeRegionalStats(rainfall: number, zones: Zone[]) {
  const simulated = zones.map((z) => computeSimulatedZoneRisk(z, rainfall))
  const affectedZones = simulated.filter((s) => s.riskScore >= 2.5).length
  const populationAtRisk = simulated
    .filter((s) => s.riskScore >= 2.5)
    .reduce((sum, s) => sum + (getZoneExposure(s.zone.id)?.estimatedPopulationInRadius ?? 0), 0)

  return {
    regionalTier: computeRegionalTier(rainfall),
    affectedZones,
    populationAtRisk,
    simulated,
  }
}
