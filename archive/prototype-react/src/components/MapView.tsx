import { useState } from 'react'
import { Globe, Map } from 'lucide-react'
import { zones } from '../data/mockData'
import NERMap from './NERMap'
import EarthGlobeMap from './globe/EarthGlobeMap'
import type { RiskLevel } from '../utils/riskColors'

type MapMode = 'globe' | 'map2d'

interface MapViewProps {
  height?: string
  zoneRisks?: { zoneId: string; riskLevel: RiskLevel }[]
  interactive?: boolean
  defaultMode?: MapMode
  showMapToggle?: boolean
}

export default function MapView({
  height = '420px',
  zoneRisks,
  interactive = true,
  defaultMode = 'globe',
  showMapToggle = true,
}: MapViewProps) {
  const [mode, setMode] = useState<MapMode>(defaultMode)

  return (
    <div className="space-y-2">
      {showMapToggle && (
        <div className="flex items-center justify-end gap-1">
          <Globe className="mr-1 h-4 w-4 text-slate-500" />
          <button
            onClick={() => setMode('globe')}
            className={`rounded-l-lg border border-ridge-border px-3 py-1 text-xs transition ${
              mode === 'globe'
                ? 'bg-risk-low/20 text-risk-low border-risk-low/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Earth
          </button>
          <button
            onClick={() => setMode('map2d')}
            className={`rounded-r-lg border border-l-0 border-ridge-border px-3 py-1 text-xs transition ${
              mode === 'map2d'
                ? 'bg-risk-low/20 text-risk-low border-risk-low/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <Map className="h-3 w-3" /> 2D Map
            </span>
          </button>
        </div>
      )}

      {mode === 'globe' ? (
        <EarthGlobeMap
          height={height}
          zoneRisks={zoneRisks}
          interactive={interactive}
        />
      ) : (
        <NERMap zones={zones} height={height} />
      )}
    </div>
  )
}
