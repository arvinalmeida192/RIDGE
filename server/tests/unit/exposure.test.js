import { getSeverityTier, getExposureSummary } from '../../src/services/exposure.js'

describe('getSeverityTier', () => {
  const baseExposure = {
    estimatedPopulationInRadius: 0,
    estimatedStructuresAtRisk: 0,
    roadNetworkLengthAtRiskKm: 0,
  }

  it('returns Localized for low risk and exposure', () => {
    expect(getSeverityTier('Low', baseExposure)).toBe('Localized')
  })

  it('returns Severe for high population', () => {
    expect(getSeverityTier('High', {
      ...baseExposure,
      estimatedPopulationInRadius: 700,
    })).toBe('Severe')
  })

  it('returns Catastrophic for critical risk with population', () => {
    expect(getSeverityTier('Critical', {
      ...baseExposure,
      estimatedPopulationInRadius: 1500,
    })).toBe('Catastrophic')
  })
})

describe('getExposureSummary', () => {
  it('returns fallback when no exposure', () => {
    expect(getExposureSummary(null)).toBe('No exposure data')
  })

  it('includes road and population', () => {
    const summary = getExposureSummary({
      estimatedPopulationInRadius: 500,
      roads: [{ name: 'NH-206' }],
      settlements: [{ name: 'Sohra', population: 500 }],
      infrastructure: [],
    })
    expect(summary).toContain('NH-206')
    expect(summary).toContain('500')
  })
})
