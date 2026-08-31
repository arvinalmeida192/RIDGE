import { pool } from '../config/database.js'

const RISK_WEIGHT = { Low: 1, Moderate: 2, High: 3, 'Very High': 4, Critical: 5 }

export function getSeverityTier(riskLevel, exposure) {
  const exposureScore =
    (exposure.estimatedPopulationInRadius ?? 0) / 400 +
    (exposure.estimatedStructuresAtRisk ?? 0) / 60 +
    (exposure.roadNetworkLengthAtRiskKm ?? 0) / 4
  const combined =
    (RISK_WEIGHT[riskLevel] ?? 1) * 0.55 + Math.min(5, exposureScore) * 0.45

  if (combined >= 4.2 || (riskLevel === 'Critical' && exposure.estimatedPopulationInRadius > 1000)) {
    return 'Catastrophic'
  }
  if (combined >= 3.2 || exposure.estimatedPopulationInRadius > 600) return 'Severe'
  if (combined >= 2.2 || exposure.estimatedPopulationInRadius > 250) return 'Moderate'
  return 'Localized'
}

export function getExposureSummary(exposure) {
  if (!exposure) return 'No exposure data'
  const topRoad = exposure.roads?.[0]?.name ?? 'local roads'
  const topSettlement = exposure.settlements?.[0]
  const pop = topSettlement
    ? `~${topSettlement.population.toLocaleString('en-IN')} residents`
    : `~${(exposure.estimatedPopulationInRadius ?? 0).toLocaleString('en-IN')} residents`
  const infraCount = exposure.infrastructure?.length ?? 0
  return `${topRoad}, ${pop}${infraCount > 0 ? `, ${infraCount} infrastructure site${infraCount > 1 ? 's' : ''}` : ''}`
}

export async function assessExposure(zoneId, radiusKm) {
  const radiusM = radiusKm * 1000

  const { rows: popRows } = await pool.query(
    `SELECT COALESCE(SUM(s.population), 0)::int AS population
     FROM settlements s
     JOIN zones z ON z.id = $1
     WHERE ST_DWithin(s.geom::geography, z.geom::geography, $2)`,
    [zoneId, radiusM],
  )

  const { rows: roadRows } = await pool.query(
    `SELECT r.name, ST_Length(r.geom::geography) / 1000 AS length_km
     FROM roads r
     JOIN zones z ON z.id = $1
     WHERE ST_DWithin(r.geom::geography, z.geom::geography, $2)
     ORDER BY length_km DESC NULLS LAST
     LIMIT 5`,
    [zoneId, radiusM],
  )

  const { rows: settlementRows } = await pool.query(
    `SELECT s.name, s.population
     FROM settlements s
     JOIN zones z ON z.id = $1
     WHERE ST_DWithin(s.geom::geography, z.geom::geography, $2)
     ORDER BY s.population DESC NULLS LAST
     LIMIT 5`,
    [zoneId, radiusM],
  )

  const population = popRows[0]?.population ?? 0
  const roadKm = roadRows.reduce((sum, r) => sum + (parseFloat(r.length_km) || 0), 0)
  const structures = Math.round(population / 6.5)

  return {
    estimatedPopulationInRadius: population,
    estimatedStructuresAtRisk: structures,
    roadNetworkLengthAtRiskKm: Math.round(roadKm * 10) / 10,
    agriculturalLandHectares: Math.round(population * 0.02),
    roads: roadRows.map((r) => ({ name: r.name, lengthKm: Math.round((r.length_km ?? 0) * 10) / 10 })),
    settlements: settlementRows.map((s) => ({ name: s.name, population: s.population })),
    infrastructure: [],
  }
}

export async function updateZoneExposureCache(zoneId, radiusKm, riskLevel) {
  const exposure = await assessExposure(zoneId, radiusKm)
  const severity = getSeverityTier(riskLevel, exposure)
  const summary = getExposureSummary(exposure)

  await pool.query(
    `INSERT INTO zone_exposure
       (zone_id, estimated_population_in_radius, estimated_structures_at_risk,
        road_network_length_at_risk_km, agricultural_land_hectares,
        severity_tier, exposure_summary, exposure_details, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (zone_id) DO UPDATE SET
       estimated_population_in_radius = EXCLUDED.estimated_population_in_radius,
       estimated_structures_at_risk = EXCLUDED.estimated_structures_at_risk,
       road_network_length_at_risk_km = EXCLUDED.road_network_length_at_risk_km,
       agricultural_land_hectares = EXCLUDED.agricultural_land_hectares,
       severity_tier = EXCLUDED.severity_tier,
       exposure_summary = EXCLUDED.exposure_summary,
       exposure_details = EXCLUDED.exposure_details,
       updated_at = NOW()`,
    [
      zoneId,
      exposure.estimatedPopulationInRadius,
      exposure.estimatedStructuresAtRisk,
      exposure.roadNetworkLengthAtRiskKm,
      exposure.agriculturalLandHectares,
      severity,
      summary,
      JSON.stringify({
        roads: exposure.roads,
        settlements: exposure.settlements,
        infrastructure: exposure.infrastructure,
      }),
    ],
  )

  return { ...exposure, severityTier: severity, exposureSummary: summary }
}

export default {
  getSeverityTier,
  getExposureSummary,
  assessExposure,
  updateZoneExposureCache,
}
