import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import type { Zone } from '../data/mockData'
import { getExposureSummary, getZoneExposure, getSeverityTier } from '../data/mockData'
import { HEAT_GRADIENT_STOPS, RISK_COLORS } from '../utils/riskColors'
import RiskBadge from './RiskBadge'
import HeatmapLayer from './HeatmapLayer'
import LayerControlPanel from './terrain/LayerControlPanel'
import { useSimulator } from '../context/SimulatorContext'
import {
  RainfallOverlay,
  RoadsOverlay,
  SettlementsOverlay,
  HotspotsOverlay,
} from './map/NERMapLayers'
import 'leaflet/dist/leaflet.css'

interface NERMapProps {
  zones: Zone[]
  height?: string
}

function FitBounds({ zones }: { zones: Zone[] }) {
  const map = useMap()
  useEffect(() => {
    if (zones.length > 0) {
      const lats = zones.map((z) => z.lat)
      const lngs = zones.map((z) => z.lng)
      map.fitBounds([
        [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
        [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5],
      ])
    }
  }, [map, zones])
  return null
}

function MapLegend() {
  return (
    <div className="rounded-lg border border-ridge-border bg-slate-900/90 px-3 py-2 backdrop-blur-sm">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Risk Intensity</div>
      <div
        className="h-2.5 w-32 rounded-full"
        style={{ background: `linear-gradient(to right, ${HEAT_GRADIENT_STOPS.join(', ')})` }}
      />
      <div className="mt-1 flex justify-between text-[9px] text-slate-500">
        <span>Low</span>
        <span>Critical</span>
      </div>
    </div>
  )
}

type RiskViewMode = 'heatmap' | 'markers'

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: RiskViewMode
  onChange: (mode: RiskViewMode) => void
}) {
  return (
    <div className="rounded-xl border border-ridge-border bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
        <Layers className="h-3 w-3" />
        Risk Display
      </div>
      <div className="flex overflow-hidden rounded-lg border border-ridge-border text-xs">
        <button
          onClick={() => onChange('heatmap')}
          className={`px-3 py-1.5 font-medium transition ${
            mode === 'heatmap'
              ? 'bg-risk-low/20 text-risk-low'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Heatmap
        </button>
        <button
          onClick={() => onChange('markers')}
          className={`border-l border-ridge-border px-3 py-1.5 font-medium transition ${
            mode === 'markers'
              ? 'bg-risk-low/20 text-risk-low'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Markers
        </button>
      </div>
    </div>
  )
}

export default function NERMap({ zones, height = '500px' }: NERMapProps) {
  const { layers } = useSimulator()
  const [viewMode, setViewMode] = useState<RiskViewMode>('heatmap')
  const center: [number, number] = [25.5, 93.0]

  const riskZonesOn = layers.riskZones.enabled
  const showHeatmap = riskZonesOn && viewMode === 'heatmap'
  const showMarkers = riskZonesOn

  return (
    <div className="relative overflow-hidden rounded-xl border border-ridge-border" style={{ height }}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds zones={zones} />

        {layers.rainfall.enabled && (
          <RainfallOverlay zones={zones} opacity={layers.rainfall.opacity} />
        )}

        {layers.roads.enabled && (
          <RoadsOverlay opacity={layers.roads.opacity} />
        )}

        {layers.settlements.enabled && (
          <SettlementsOverlay opacity={layers.settlements.opacity} />
        )}

        {showHeatmap && <HeatmapLayer zones={zones} />}

        {layers.hotspots.enabled && (
          <HotspotsOverlay zones={zones} opacity={layers.hotspots.opacity} />
        )}

        {showMarkers && zones.map((zone) => (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={
              viewMode === 'heatmap'
                ? 12
                : zone.riskLevel === 'Critical'
                  ? 14
                  : zone.riskLevel === 'Very High'
                    ? 12
                    : 10
            }
            pathOptions={
              viewMode === 'heatmap'
                ? { color: 'transparent', fillColor: 'transparent', fillOpacity: 0, weight: 0 }
                : {
                    color: RISK_COLORS[zone.riskLevel],
                    fillColor: RISK_COLORS[zone.riskLevel],
                    fillOpacity: (layers.riskZones.opacity / 100) * 0.7,
                    weight: 2,
                  }
            }
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div className="text-xs">
                <span className="font-medium">{zone.name}</span>
                <span className="text-slate-400"> — {zone.riskLevel}</span>
                {(() => {
                  const exposure = getZoneExposure(zone.id)
                  if (!exposure) return null
                  const tier = getSeverityTier(zone.riskLevel, exposure)
                  return (
                    <div className="mt-0.5 text-slate-300">
                      {tier} — {getExposureSummary(zone.id)}
                    </div>
                  )
                })()}
              </div>
            </Tooltip>
            <Popup>
              <div className="space-y-2 p-1">
                <div className="font-semibold">{zone.name}</div>
                <div className="text-sm text-slate-400">{zone.state}</div>
                <RiskBadge level={zone.riskLevel} size="sm" />
                {(() => {
                  const exposure = getZoneExposure(zone.id)
                  if (!exposure) return null
                  const tier = getSeverityTier(zone.riskLevel, exposure)
                  return (
                    <div className="rounded border border-risk-high/30 bg-risk-high/10 px-2 py-1.5 text-xs text-slate-300">
                      <span className="font-medium text-risk-high">{tier}</span>
                      {' — '}
                      {getExposureSummary(zone.id)}
                    </div>
                  )
                })()}
                <Link to={`/zone/${zone.id}`} className="block text-sm text-blue-400 hover:underline">
                  View details →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Permanent overlay — sits above Leaflet panes (z 400–700) */}
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute left-3 top-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        <div className="pointer-events-auto absolute right-3 top-3">
          <LayerControlPanel />
        </div>
        {showHeatmap && (
          <div className="pointer-events-none absolute bottom-3 left-3">
            <MapLegend />
          </div>
        )}
      </div>
    </div>
  )
}
