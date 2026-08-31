import {
  matchingRule,
  shouldEscalate,
  shouldDeescalate,
  buildGuidance,
} from '../../src/services/alertRules.js'

const zone = (overrides = {}) => ({
  id: 'z01',
  name: 'Sohra',
  risk_score: 1,
  risk_level: 'Low',
  risk_trend_6h: 0,
  active_triggers: [],
  ...overrides,
})

describe('matchingRule', () => {
  it('returns Warning for high risk score', () => {
    expect(matchingRule(zone({ risk_score: 4.6 }))?.tier).toBe('Warning')
  })

  it('returns Warning for rising trend at 4.0+', () => {
    expect(matchingRule(zone({ risk_score: 4.1, risk_trend_6h: 0.5 }))?.tier).toBe('Warning')
  })

  it('returns Watch for score >= 3.5', () => {
    expect(matchingRule(zone({ risk_score: 3.6 }))?.tier).toBe('Watch')
  })

  it('returns Advisory for active triggers', () => {
    expect(matchingRule(zone({ risk_score: 1.5, active_triggers: ['heavy_rain'] }))?.tier).toBe('Advisory')
  })

  it('returns null for low risk with no triggers', () => {
    expect(matchingRule(zone({ risk_score: 1.2 }))).toBeNull()
  })
})

describe('shouldEscalate', () => {
  it('escalates when no current alert', () => {
    expect(shouldEscalate(null, 'Warning')).toBe(true)
  })

  it('escalates from Advisory to Warning', () => {
    expect(shouldEscalate({ tier: 'Advisory' }, 'Warning')).toBe(true)
  })

  it('does not escalate from Warning to Advisory', () => {
    expect(shouldEscalate({ tier: 'Warning' }, 'Advisory')).toBe(false)
  })
})

describe('shouldDeescalate', () => {
  const twoHoursAgo = new Date(Date.now() - 120 * 60000).toISOString()

  it('blocks de-escalation before min duration', () => {
    const alert = { tier: 'Warning', issuedAt: new Date().toISOString() }
    expect(shouldDeescalate(alert, zone({ risk_score: 1.5 }))).toBe(false)
  })

  it('allows de-escalation after min duration when risk drops', () => {
    const alert = { tier: 'Warning', issuedAt: twoHoursAgo }
    expect(shouldDeescalate(alert, zone({ risk_score: 3.5 }), Date.now())).toBe(true)
  })

  it('blocks de-escalation when rule still matches', () => {
    const alert = { tier: 'Warning', issuedAt: twoHoursAgo }
    expect(shouldDeescalate(alert, zone({ risk_score: 4.6 }), Date.now())).toBe(false)
  })
})

describe('buildGuidance', () => {
  it('generates tier-specific guidance', () => {
    const guidance = buildGuidance('Warning', zone(), { roads: [{ name: 'NH-206' }] })
    expect(guidance).toContain('NH-206')
    expect(guidance).toContain('Evacuate')
  })
})
