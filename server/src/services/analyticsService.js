import { pool } from '../config/database.js'
import { formatISTDateTime } from '../utils/formatIST.js'

export async function getDashboardStats() {
  const [
    { rows: zoneCount },
    { rows: alertCount },
    { rows: highRisk },
    { rows: lastSync },
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM zones WHERE is_active = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM alerts WHERE is_active = true'),
    pool.query(
      `SELECT COUNT(DISTINCT z.id)::int AS count
       FROM zones z
       JOIN LATERAL (
         SELECT risk_level FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
       ) rs ON true
       WHERE rs.risk_level IN ('High', 'Very High', 'Critical')`,
    ),
    pool.query('SELECT MAX(time) AS ts FROM sensor_readings'),
  ])

  const ts = lastSync[0]?.ts
  const lastSyncStr = ts ? formatISTDateTime(ts) : 'unknown'

  return {
    totalZones: zoneCount[0]?.count ?? 0,
    activeAlerts: alertCount[0]?.count ?? 0,
    highRiskZones: highRisk[0]?.count ?? 0,
    lastSync: lastSyncStr,
  }
}

export async function getRiskDistribution() {
  const { rows } = await pool.query(
    `SELECT rs.risk_level AS level, COUNT(*)::int AS count
     FROM zones z
     JOIN LATERAL (
       SELECT risk_level FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) rs ON true
     WHERE z.is_active = true
     GROUP BY rs.risk_level
     ORDER BY count DESC`,
  )
  return rows
}

export async function getRainfallCorrelation() {
  const { rows } = await pool.query(
    `SELECT z.name AS zone, sr.rainfall_24h AS rainfall, rs.risk_score AS risk
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT rainfall_24h FROM sensor_readings WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) sr ON true
     LEFT JOIN LATERAL (
       SELECT risk_score FROM risk_scores WHERE zone_id = z.id ORDER BY time DESC LIMIT 1
     ) rs ON true
     WHERE z.is_active = true
     ORDER BY rs.risk_score DESC NULLS LAST`,
  )
  return rows
}

export async function getSeasonalHeatmap() {
  const { rows } = await pool.query(
    `SELECT EXTRACT(MONTH FROM time)::int AS month,
            AVG(risk_score) AS avg_risk,
            COUNT(*)::int AS readings
     FROM risk_scores
     WHERE time > NOW() - INTERVAL '12 months'
     GROUP BY EXTRACT(MONTH FROM time)
     ORDER BY month`,
  )
  return rows.map((r) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][r.month - 1],
    avgRisk: Math.round(r.avg_risk * 10) / 10,
    readings: r.readings,
  }))
}

export default {
  getDashboardStats,
  getRiskDistribution,
  getRainfallCorrelation,
  getSeasonalHeatmap,
}
