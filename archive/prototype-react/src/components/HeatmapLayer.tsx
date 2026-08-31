import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { Zone } from '../data/mockData'
import { normalizeRiskIntensity } from '../utils/riskColors'

const HEAT_GRADIENT: Record<number, string> = {
  0.0: '#4ADE80',
  0.25: '#FDE047',
  0.5: '#FB923C',
  0.75: '#FF3B3B',
  1.0: '#FF1155',
}

interface HeatmapLayerProps {
  zones: Zone[]
}

export default function HeatmapLayer({ zones }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number, number][] = zones.map((z) => [
      z.lat,
      z.lng,
      normalizeRiskIntensity(z.riskScore),
    ])

    const layer = L.heatLayer(points, {
      radius: 58,
      blur: 32,
      max: 0.85,
      minOpacity: 0.55,
      gradient: HEAT_GRADIENT,
    }).addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, zones])

  return null
}

export { HEAT_GRADIENT }
