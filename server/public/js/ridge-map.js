const RISK_COLORS = {
  Low: '#22c55e',
  Moderate: '#eab308',
  High: '#f97316',
  'Very High': '#ef4444',
  Critical: '#dc2626',
}

const MARKER_RADIUS = 12
const MARKER_BORDER = '#0f172a'

function riskColor(level) {
  return RISK_COLORS[level] || '#38bdf8'
}

function riskWeight(score) {
  return Math.max(0.1, (score || 1) / 5)
}

function zoneLabel(z) {
  const level = z.riskLevel || 'Unknown'
  const score = z.riskScore != null ? z.riskScore.toFixed(1) : '—'
  return `${level} (${score})`
}

function buildZonePopup(z, detailPath) {
  const id = z.id
  const name = z.name || id || 'Monitoring zone'
  const state = z.state || ''
  const detailsLink = id
    ? `<a class="map-popup-link" href="${detailPath}${id}">View area details →</a>`
    : '<span style="color:#94a3b8">Details unavailable</span>'
  return `<strong>${name}</strong><br>${state}<br>Risk: ${zoneLabel(z)}<br>${detailsLink}`
}

function addZoneMarker(map, markerLayer, z, detailPath) {
  if (z.lat == null || z.lng == null) return

  const color = riskColor(z.riskLevel)
  const marker = L.circleMarker([z.lat, z.lng], {
    radius: MARKER_RADIUS,
    fillColor: color,
    color: MARKER_BORDER,
    weight: 3,
    opacity: 1,
    fillOpacity: 0.95,
  })

  marker.bindPopup(buildZonePopup(z, detailPath))

  if (z.id) {
    marker.on('click', () => {
      window.location.href = `${detailPath}${z.id}`
    })
  }

  marker.on('mouseover', function highlightMarker() {
    this.setStyle({ radius: MARKER_RADIUS + 3, weight: 4 })
    this.openPopup()
  })
  marker.on('mouseout', function resetMarker() {
    this.setStyle({ radius: MARKER_RADIUS, weight: 3 })
  })

  marker.addTo(markerLayer)
}

const RidgeMap = {
  instances: {},
  mode: 'both',

  init(containerId, opts = {}) {
    const el = document.getElementById(containerId)
    if (!el || typeof L === 'undefined') return

    const config = JSON.parse(el.dataset.mapConfig || '{}')
    const zones = (config.zones || []).filter((z) => z.lat != null && z.lng != null)
    const detailPath = config.detailPath || '/zones/'
    const tiles = window.RIDGE_MAP_TILES || {}
    const tileUrl = tiles.url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    const tileAttribution = tiles.attribution || '&copy; OpenStreetMap contributors'
    const center = zones.length
      ? [zones.reduce((s, z) => s + z.lat, 0) / zones.length, zones.reduce((s, z) => s + z.lng, 0) / zones.length]
      : [25.5, 93.0]

    const map = L.map(containerId, { scrollWheelZoom: true }).setView(center, opts.single ? 10 : 6)
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(map)

    const heatPoints = zones.map((z) => [z.lat, z.lng, riskWeight(z.riskScore)])
    let heatLayer = null
    const markerLayer = L.layerGroup().addTo(map)

    if (typeof L.heatLayer === 'function' && !opts.single && zones.length > 1) {
      heatLayer = L.heatLayer(heatPoints, { radius: 40, blur: 28, maxZoom: 11 }).addTo(map)
    }

    zones.forEach((z) => addZoneMarker(map, markerLayer, z, detailPath))

    if (config.roads) {
      config.roads.forEach((road) => {
        if (road.coordinates?.length > 1) {
          L.polyline(road.coordinates, { color: '#475569', weight: 3, opacity: 0.75 }).addTo(map)
        }
      })
    }

    if (config.settlements) {
      config.settlements.forEach((s) => {
        if (s.lat == null || s.lng == null) return
        const settlementMarker = L.circleMarker([s.lat, s.lng], {
          radius: 6,
          fillColor: '#6366f1',
          color: MARKER_BORDER,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
        const zoneLink = s.zoneId
          ? `<br><a class="map-popup-link" href="${detailPath}${s.zoneId}">View area details →</a>`
          : ''
        settlementMarker.bindPopup(`<strong>${s.name}</strong><br>Pop: ${s.population?.toLocaleString('en-IN') || '—'}${zoneLink}`)
        if (s.zoneId) {
          settlementMarker.on('click', () => {
            window.location.href = `${detailPath}${s.zoneId}`
          })
        }
        settlementMarker.addTo(map)
      })
    }

    if (zones.length > 1) {
      const bounds = zones.map((z) => [z.lat, z.lng])
      map.fitBounds(bounds, { padding: [40, 40] })
    } else if (zones.length === 1) {
      map.setView([zones[0].lat, zones[0].lng], opts.single ? 11 : 8)
    }

    this.instances[containerId] = { map, heatLayer, markerLayer }
    return map
  },

  setMode(mode) {
    this.mode = mode
    Object.values(this.instances).forEach(({ map, heatLayer, markerLayer }) => {
      if (!heatLayer) return
      if (mode === 'heatmap') {
        if (!map.hasLayer(heatLayer)) map.addLayer(heatLayer)
        if (!map.hasLayer(markerLayer)) map.addLayer(markerLayer)
      } else {
        map.removeLayer(heatLayer)
        if (!map.hasLayer(markerLayer)) map.addLayer(markerLayer)
      }
    })
  },
}

window.RidgeMap = RidgeMap
