const SAFE_STRING = /^[\w\s.,\-+()/'"]*$/u
const ZONE_ID = /^z\d{2}$/

export function validateQuery(schema = {}) {
  return (req, res, next) => {
    for (const [key, type] of Object.entries(schema)) {
      const value = req.query[key]
      if (value === undefined || value === '') continue

      if (type === 'string' && typeof value === 'string') {
        if (!SAFE_STRING.test(value) || value.length > 100) {
          return res.status(400).json({ error: `Invalid query parameter: ${key}` })
        }
      }
    }
    next()
  }
}

export function validateZoneId(req, res, next) {
  if (!ZONE_ID.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid zone id' })
  }
  next()
}

export default { validateQuery, validateZoneId }
