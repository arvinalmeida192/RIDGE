import * as alertService from '../services/alertService.js'

const EVACUATION_INFO = {
  z01: { centre: 'Sohra Community Hall', contact: '+91-98765-43210', route: 'NH-206 north to Shillong' },
  z02: { centre: 'Mawsynram PHC', contact: '+91-98765-43211', route: 'Village upper road' },
  z03: { centre: 'Kamakhya Relief Camp', contact: '+91-98765-43212', route: 'Guwahati-Shillong Highway' },
  z04: { centre: 'Tawang Relief Centre', contact: '+91-98765-43213', route: 'Bomdila-Tawang Highway' },
  z05: { centre: 'Aizawl Community Hall', contact: '+91-98765-43214', route: 'NH-54 to Aizawl' },
  z06: { centre: 'Kohima Town Hall', contact: '+91-98765-43215', route: 'Dimapur-Kohima Road' },
  z07: { centre: 'Gangtok Relief Camp', contact: '+91-98765-43216', route: 'NH-10 to Gangtok' },
  z08: { centre: 'Imphal West PHC', contact: '+91-98765-43217', route: 'Imphal-Jiribam Road' },
  z09: { centre: 'Imphal Valley Centre', contact: '+91-98765-43218', route: 'NH-2 to Imphal' },
  z10: { centre: 'Dibrugarh Relief Camp', contact: '+91-98765-43219', route: 'NH-37 to Dibrugarh' },
}

const EMERGENCY_CONTACTS = [
  { name: 'NDMA Helpline', phone: '1078' },
  { name: 'State SDMA (Meghalaya)', phone: '0364-222-0000' },
  { name: 'RIDGE Operations', phone: '+91-98765-43000' },
]

export function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`
  return null
}

export async function getCitizenAlerts(req, res, next) {
  try {
    const alerts = await alertService.getCitizenAlerts(req.query.zone_id)
    res.json(alerts)
  } catch (err) {
    next(err)
  }
}

export async function getSubscriptions(req, res, next) {
  try {
    const { zone_id: zoneId } = req.query
    if (!zoneId) return res.status(400).json({ error: 'zone_id is required' })
    const subs = await alertService.getSubscriptionsForZone(zoneId, req.user?.sub ?? null)
    res.json(subs)
  } catch (err) {
    next(err)
  }
}

export async function getEvacuationInfo(req, res, next) {
  try {
    const zoneId = req.query.zone_id
    const info = EVACUATION_INFO[zoneId] ?? {
      centre: 'Nearest designated relief centre',
      contact: '1078',
      route: 'Follow local authority guidance',
    }
    res.json({ zoneId, ...info })
  } catch (err) {
    next(err)
  }
}

export async function getEmergencyContacts(req, res, next) {
  try {
    res.json(EMERGENCY_CONTACTS)
  } catch (err) {
    next(err)
  }
}

export async function subscribe(req, res, next) {
  try {
    const { zoneId, phone: rawPhone } = req.body
    if (!zoneId || !rawPhone) {
      return res.status(400).json({ error: 'zoneId and phone are required' })
    }
    const phone = normalizePhone(rawPhone)
    if (!phone) {
      return res.status(400).json({ error: 'Invalid phone number. Use a 10-digit Indian mobile number.' })
    }
    const sub = await alertService.subscribeToZone(zoneId, phone, req.user?.sub ?? null)
    res.status(201).json({ ...sub, message: 'Subscribed successfully' })
  } catch (err) {
    next(err)
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { zoneId, phone: rawPhone } = req.body
    if (!zoneId || !rawPhone) {
      return res.status(400).json({ error: 'zoneId and phone are required' })
    }
    const phone = normalizePhone(rawPhone) || rawPhone
    const result = await alertService.unsubscribeFromZone(zoneId, phone)
    res.json({ ...result, message: 'Unsubscribed successfully' })
  } catch (err) {
    next(err)
  }
}

export function getEvacuationForZone(zoneId) {
  return EVACUATION_INFO[zoneId] ?? null
}

export function getEmergencyContactsList() {
  return EMERGENCY_CONTACTS
}
