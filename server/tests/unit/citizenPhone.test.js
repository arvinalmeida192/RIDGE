import { normalizePhone } from '../../src/controllers/citizenController.js'

describe('normalizePhone', () => {
  it('normalizes 10-digit Indian mobile', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210')
    expect(normalizePhone('98765 43210')).toBe('+919876543210')
  })

  it('normalizes +91 and 91 prefixes', () => {
    expect(normalizePhone('+919876543210')).toBe('+919876543210')
    expect(normalizePhone('919876543210')).toBe('+919876543210')
  })

  it('rejects invalid numbers', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('5876543210')).toBeNull()
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone(null)).toBeNull()
  })
})
