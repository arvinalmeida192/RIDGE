import { riskFromScore } from '../../src/utils/riskUtils.js'

describe('riskFromScore', () => {
  it('maps scores to correct risk levels', () => {
    expect(riskFromScore(1.0)).toBe('Low')
    expect(riskFromScore(1.5)).toBe('Moderate')
    expect(riskFromScore(2.5)).toBe('High')
    expect(riskFromScore(3.5)).toBe('Very High')
    expect(riskFromScore(4.5)).toBe('Critical')
  })

  it('handles boundary values', () => {
    expect(riskFromScore(1.49)).toBe('Low')
    expect(riskFromScore(4.49)).toBe('Very High')
  })
})
