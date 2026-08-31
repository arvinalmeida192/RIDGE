/**
 * Physical bounds validation for environmental sensor readings.
 * Readings outside bounds are rejected (logged, not stored).
 */

export const BOUNDS = {
  rainfall_1h: { min: 0, max: 500 },
  rainfall_24h: { min: 0, max: 1500 },
  rainfall_72h: { min: 0, max: 3000 },
  cumulative_7d: { min: 0, max: 5000 },
  soil_saturation: { min: 0, max: 100 },
  ground_movement: { min: 0, max: 100 },
  temperature: { min: -25, max: 55 },
  precipitation_mm: { min: 0, max: 500 },
}

export function isWithinBounds(field, value) {
  if (value === null || value === undefined) return true
  const bound = BOUNDS[field]
  if (!bound) return true
  return value >= bound.min && value <= bound.max
}

export function validateSensorReading(reading) {
  const errors = []
  const fields = [
    'rainfall_1h', 'rainfall_24h', 'rainfall_72h', 'cumulative_7d',
    'soil_saturation', 'ground_movement', 'temperature',
  ]

  for (const field of fields) {
    if (reading[field] !== undefined && reading[field] !== null) {
      if (!isWithinBounds(field, reading[field])) {
        errors.push(`${field}=${reading[field]} outside [${BOUNDS[field].min}, ${BOUNDS[field].max}]`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function clampOrNull(field, value) {
  if (value === null || value === undefined) return null
  const bound = BOUNDS[field]
  if (!bound) return value
  if (value < bound.min || value > bound.max) return null
  return value
}
