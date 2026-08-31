export const TIER_RANK = { Advisory: 1, Watch: 2, Warning: 3 }

export const ALERT_RULES = [
  {
    tier: 'Warning',
    conditions: (zone) =>
      zone.risk_score >= 4.5 ||
      (zone.risk_score >= 4.0 && zone.risk_trend_6h > 0.3),
    affectedRadiusKm: (zone) => Math.min(15, 5 + zone.risk_score * 2),
    hysteresis: { downgrade_below: 4.0, min_duration_min: 60 },
  },
  {
    tier: 'Watch',
    conditions: (zone) =>
      zone.risk_score >= 3.5 ||
      (zone.risk_score >= 3.0 && (zone.active_triggers?.length ?? 0) >= 2),
    affectedRadiusKm: (zone) => Math.min(10, 3 + zone.risk_score * 1.5),
    hysteresis: { downgrade_below: 3.0, min_duration_min: 120 },
  },
  {
    tier: 'Advisory',
    conditions: (zone) =>
      zone.risk_score >= 2.5 || (zone.active_triggers?.length ?? 0) >= 1,
    affectedRadiusKm: (zone) => Math.min(5, 2 + zone.risk_score),
    hysteresis: { downgrade_below: 2.0, min_duration_min: 180 },
  },
]

const GUIDANCE_TEMPLATES = {
  Warning: (zone, exposure) => {
    const road = exposure?.roads?.[0]?.name ?? 'major roads'
    return `Evacuate low-lying settlements immediately. Avoid all travel on ${road}.`
  },
  Watch: (zone) =>
    `Prepare evacuation kits. Monitor local radio for updates in ${zone.name}.`,
  Advisory: () =>
    'Exercise caution on hillside roads. Report ground cracks to authorities.',
}

export function matchingRule(zone) {
  for (const rule of ALERT_RULES) {
    if (rule.conditions(zone)) return rule
  }
  return null
}

export function shouldEscalate(currentAlert, newTier) {
  if (!currentAlert) return true
  return (TIER_RANK[newTier] ?? 0) > (TIER_RANK[currentAlert.tier] ?? 0)
}

export function shouldDeescalate(currentAlert, zone, now = Date.now()) {
  const rule = ALERT_RULES.find((r) => r.tier === currentAlert.tier)
  if (!rule) return zone.risk_score < 2.0

  const elapsedMin = (now - new Date(currentAlert.issuedAt).getTime()) / 60000
  if (elapsedMin < rule.hysteresis.min_duration_min) return false

  const stillMatches = rule.conditions(zone)
  if (stillMatches) return false

  return zone.risk_score < rule.hysteresis.downgrade_below
}

export function buildGuidance(tier, zone, exposure) {
  const fn = GUIDANCE_TEMPLATES[tier]
  return fn ? fn(zone, exposure) : `Alert for ${zone.name}. Monitor conditions.`
}

export default {
  TIER_RANK,
  ALERT_RULES,
  matchingRule,
  shouldEscalate,
  shouldDeescalate,
  buildGuidance,
}
