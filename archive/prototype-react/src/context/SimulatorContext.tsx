import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import { zones } from '../data/mockData'
import { STUDY_REGION_ZONE_IDS } from '../utils/terrain'
import { BASELINE_RAINFALL, computeRegionalStats, type SimulatedZone } from '../utils/simulator'
import type { RiskLevel } from '../utils/riskColors'

export type LayerKey = 'riskZones' | 'rainfall' | 'roads' | 'settlements' | 'hotspots'

export interface LayerConfig {
  enabled: boolean
  opacity: number
}

const DEFAULT_LAYERS: Record<LayerKey, LayerConfig> = {
  riskZones: { enabled: true, opacity: 100 },
  rainfall: { enabled: false, opacity: 60 },
  roads: { enabled: false, opacity: 80 },
  settlements: { enabled: false, opacity: 85 },
  hotspots: { enabled: false, opacity: 90 },
}

/** Zones within the East Khasi Hills study region */
const studyZones = zones.filter((z) => (STUDY_REGION_ZONE_IDS as readonly string[]).includes(z.id))

interface SimulatorContextValue {
  rainfall: number
  baselineRainfall: number
  isSimulating: boolean
  layers: Record<LayerKey, LayerConfig>
  simulatedZones: SimulatedZone[]
  regionalTier: RiskLevel
  affectedZones: number
  populationAtRisk: number
  setRainfall: (value: number) => void
  setLayerEnabled: (key: LayerKey, enabled: boolean) => void
  setLayerOpacity: (key: LayerKey, opacity: number) => void
  resetToBaseline: () => void
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null)

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [rainfall, setRainfall] = useState(BASELINE_RAINFALL)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)

  const stats = useMemo(() => computeRegionalStats(rainfall, studyZones), [rainfall])

  const setLayerEnabled = useCallback((key: LayerKey, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], enabled } }))
  }, [])

  const setLayerOpacity = useCallback((key: LayerKey, opacity: number) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity } }))
  }, [])

  const resetToBaseline = useCallback(() => {
    setRainfall(BASELINE_RAINFALL)
  }, [])

  return (
    <SimulatorContext.Provider
      value={{
        rainfall,
        baselineRainfall: BASELINE_RAINFALL,
        isSimulating: rainfall !== BASELINE_RAINFALL,
        layers,
        simulatedZones: stats.simulated,
        regionalTier: stats.regionalTier,
        affectedZones: stats.affectedZones,
        populationAtRisk: stats.populationAtRisk,
        setRainfall,
        setLayerEnabled,
        setLayerOpacity,
        resetToBaseline,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext)
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider')
  return ctx
}
