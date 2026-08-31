export function riskFromScore(score) {
  if (score >= 4.5) return 'Critical'
  if (score >= 3.5) return 'Very High'
  if (score >= 2.5) return 'High'
  if (score >= 1.5) return 'Moderate'
  return 'Low'
}
