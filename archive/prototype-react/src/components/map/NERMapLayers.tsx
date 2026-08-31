import { Circle, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import type { Zone } from '../../data/mockData'
import { mockRoads, mapSettlements, landslideHotspotZoneIds } from '../../data/mockData'

interface LayerOpacityProps {
  opacity: number
}

export function RainfallOverlay({ zones, opacity }: LayerOpacityProps & { zones: Zone[] }) {
  if (opacity <= 0) return null

  return (
    <>
      {zones.map((zone) => (
        <Circle
          key={`rain-${zone.id}`}
          center={[zone.lat, zone.lng]}
          radius={zone.rainfall24h * 180}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: (opacity / 100) * Math.min(0.55, zone.rainfall24h / 200),
            weight: 1,
            opacity: opacity / 100,
          }}
        />
      ))}
    </>
  )
}

export function RoadsOverlay({ opacity }: LayerOpacityProps) {
  if (opacity <= 0) return null

  return (
    <>
      {mockRoads.map((road) => (
        <Polyline
          key={road.id}
          positions={road.points.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: '#fbbf24',
            weight: 4,
            opacity: opacity / 100,
          }}
        >
          <Tooltip sticky>{road.name}</Tooltip>
        </Polyline>
      ))}
    </>
  )
}

export function SettlementsOverlay({ opacity }: LayerOpacityProps) {
  if (opacity <= 0) return null

  return (
    <>
      {mapSettlements.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={7}
          pathOptions={{
            color: '#e2e8f0',
            fillColor: '#94a3b8',
            fillOpacity: opacity / 100,
            weight: 2,
          }}
        >
          <Tooltip direction="top">
            <span className="text-xs font-medium">{s.name}</span>
            <span className="text-xs text-slate-400"> · {s.population.toLocaleString('en-IN')}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}

export function HotspotsOverlay({ zones, opacity }: LayerOpacityProps & { zones: Zone[] }) {
  if (opacity <= 0) return null

  const hotspotZones = zones.filter((z) => landslideHotspotZoneIds.includes(z.id))

  return (
    <>
      {hotspotZones.map((zone) => (
        <CircleMarker
          key={`hotspot-${zone.id}`}
          center={[zone.lat, zone.lng]}
          radius={16}
          pathOptions={{
            color: '#FF1155',
            fillColor: '#FF1155',
            fillOpacity: (opacity / 100) * 0.15,
            weight: 3,
            dashArray: '6 4',
          }}
        >
          <Tooltip direction="top">
            <span className="text-xs font-medium text-risk-critical">Landslide Hotspot</span>
            <br />
            <span className="text-xs">{zone.name}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}