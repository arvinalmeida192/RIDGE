const RISK_COLORS = {
  Low: '#4ade80', Moderate: '#fde047', High: '#fb923c',
  'Very High': '#ff3b3b', Critical: '#ff1155',
}

function riskColor(level) {
  return RISK_COLORS[level] || '#4ade80'
}

function riskWeight(score) {
  return Math.max(0.1, (score || 1) / 5)
}

const RidgeMap = {
  instances: {},
  mode: 'heatmap',

  init(containerId, opts = {}) {
    const el = document.getElementById(containerId)
    if (!el || typeof L === 'undefined') return

    const config = JSON.parse(el.dataset.mapConfig || '{}')
    const zones = config.zones || []
    const center = zones.length
      ? [zones.reduce((s, z) => s + z.lat, 0) / zones.length, zones.reduce((s, z) => s + z.lng, 0) / zones.length]
      : [25.5, 93.0]

    const map = L.map(containerId, { scrollWheelZoom: true }).setView(center, opts.single ? 10 : 6)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    const heatPoints = zones.map((z) => [z.lat, z.lng, riskWeight(z.riskScore)])
    let heatLayer = null
    let markerLayer = L.layerGroup().addTo(map)

    if (typeof L.heatLayer === 'function' && !opts.single) {
      heatLayer = L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 10 }).addTo(map)
    }

    zones.forEach((z) => {
      const color = riskColor(z.riskLevel)
      const marker = L.circleMarker([z.lat, z.lng], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.8,
      })
      marker.bindPopup(`<strong>${z.name}</strong><br>${z.state}<br>Risk: ${z.riskLevel} (${z.riskScore?.toFixed(1)})<br><a href="/zones/${z.id}">Details →</a>`)
      marker.addTo(markerLayer)
    })

    if (config.roads) {
      config.roads.forEach((road) => {
        if (road.coordinates?.length > 1) {
          L.polyline(road.coordinates, { color: '#64748b', weight: 2, opacity: 0.6 }).addTo(map)
        }
      })
    }

    if (config.settlements) {
      config.settlements.forEach((s) => {
        L.circleMarker([s.lat, s.lng], { radius: 4, fillColor: '#94a3b8', color: '#fff', weight: 1, fillOpacity: 0.7 })
          .bindPopup(`<strong>${s.name}</strong><br>Pop: ${s.population?.toLocaleString('en-IN')}`)
          .addTo(map)
      })
    }

    if (zones.length > 1) {
      const bounds = zones.map((z) => [z.lat, z.lng])
      map.fitBounds(bounds, { padding: [30, 30] })
    }

    this.instances[containerId] = { map, heatLayer, markerLayer }
    return map
  },

  setMode(mode) {
    this.mode = mode
    Object.values(this.instances).forEach(({ map, heatLayer, markerLayer }) => {
      if (!heatLayer) return
      if (mode === 'heatmap') {
        map.addLayer(heatLayer)
        map.removeLayer(markerLayer)
      } else {
        map.removeLayer(heatLayer)
        map.addLayer(markerLayer)
      }
    })
  },
}

window.RidgeMap = RidgeMap
