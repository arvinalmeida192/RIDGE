export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Critical'

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#4ADE80',
  Moderate: '#FDE047',
  High: '#FB923C',
  'Very High': '#FF3B3B',
  Critical: '#FF1155',
}

/** Gradient stops for heatmap legend and leaflet.heat */
export const HEAT_GRADIENT_STOPS = [
  '#4ADE80',
  '#FDE047',
  '#FB923C',
  '#FF3B3B',
  '#FF1155',
] as const

export const RISK_SCORES: Record<RiskLevel, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  'Very High': 4,
  Critical: 5,
}

export function riskFromScore(score: number): RiskLevel {
  if (score >= 4.5) return 'Critical'
  if (score >= 3.5) return 'Very High'
  if (score >= 2.5) return 'High'
  if (score >= 1.5) return 'Moderate'
  return 'Low'
}

export function riskBgClass(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Low: 'bg-risk-low/20 text-risk-low border-risk-low/40',
    Moderate: 'bg-risk-moderate/20 text-risk-moderate border-risk-moderate/40',
    High: 'bg-risk-high/20 text-risk-high border-risk-high/40',
    'Very High': 'bg-risk-very-high/20 text-risk-very-high border-risk-very-high/40',
    Critical: 'bg-risk-critical/20 text-risk-critical border-risk-critical/40',
  }
  return map[level]
}

/** Normalize a 1–5 risk score to 0–1 intensity for heatmap rendering. */
export function normalizeRiskIntensity(score: number): number {
  return Math.min(1, Math.max(0, (score - 1) / 4))
}
