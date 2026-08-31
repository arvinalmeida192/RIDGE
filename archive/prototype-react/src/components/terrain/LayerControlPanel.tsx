import { Layers } from 'lucide-react'
import { useSimulator, type LayerKey } from '../../context/SimulatorContext'

const LAYER_LABELS: Record<LayerKey, string> = {
  riskZones: 'Risk Zones',
  rainfall: 'Rainfall',
  roads: 'Roads',
  settlements: 'Settlements',
  hotspots: 'Landslide Hotspots',
}

const LAYER_ORDER: LayerKey[] = ['riskZones', 'rainfall', 'roads', 'settlements', 'hotspots']

export default function LayerControlPanel() {
  const { layers, setLayerEnabled, setLayerOpacity } = useSimulator()

  return (
    <div className="pointer-events-auto w-56 rounded-xl border border-ridge-border bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-white">
        <Layers className="h-3.5 w-3.5 text-risk-low" />
        Map Layers
      </div>
      <div className="space-y-2.5">
        {LAYER_ORDER.map((key) => {
          const layer = layers[key]
          return (
            <div key={key}>
              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="text-slate-300">{LAYER_LABELS[key]}</span>
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={(e) => setLayerEnabled(key, e.target.checked)}
                  className="accent-risk-low"
                />
              </label>
              {layer.enabled && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layer.opacity}
                  onChange={(e) => setLayerOpacity(key, Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-risk-low"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
