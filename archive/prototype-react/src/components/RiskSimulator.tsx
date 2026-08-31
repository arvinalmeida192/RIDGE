import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, CloudRain } from 'lucide-react'
import { useSimulator } from '../context/SimulatorContext'
import CountUp from './CountUp'
import { RISK_COLORS } from '../utils/riskColors'

export default function RiskSimulator() {
  const {
    rainfall,
    baselineRainfall,
    isSimulating,
    regionalTier,
    affectedZones,
    populationAtRisk,
    setRainfall,
    resetToBaseline,
  } = useSimulator()

  return (
    <div className="glass-panel rounded-xl border border-risk-low/20 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CloudRain className="h-5 w-5 text-blue-400" />
            Risk Simulator
          </h2>
          <p className="text-sm text-slate-400">
            Adjust 24h rainfall to simulate cascading regional risk
          </p>
        </div>
        {isSimulating && (
          <button
            onClick={resetToBaseline}
            className="flex items-center gap-1.5 rounded-lg border border-ridge-border px-3 py-1.5 text-xs text-slate-400 transition hover:border-risk-low/40 hover:text-risk-low"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Current Conditions
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="rainfall-slider" className="text-sm font-medium text-slate-300">
            Rainfall Simulator
          </label>
          <span className="font-mono text-sm tabular-nums text-blue-400">
            Current: {rainfall} mm / 24h
          </span>
        </div>
        <input
          id="rainfall-slider"
          type="range"
          min={50}
          max={300}
          step={1}
          value={rainfall}
          onChange={(e) => setRainfall(Number(e.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-risk-low [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-risk-low [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(74,222,128,0.6)]"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
          <span>50 mm</span>
          <span className="text-slate-400">Baseline: {baselineRainfall} mm</span>
          <span>300 mm</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-ridge-border bg-slate-900/50 p-4 text-center">
          <div className="mb-1 text-xs text-slate-500">Regional Risk Tier</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={regionalTier}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-xl font-bold"
              style={{ color: RISK_COLORS[regionalTier] }}
            >
              {regionalTier}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="rounded-lg border border-ridge-border bg-slate-900/50 p-4 text-center">
          <div className="mb-1 text-xs text-slate-500">Affected Zones</div>
          <div className="font-mono text-3xl font-bold tabular-nums text-white">
            <CountUp value={affectedZones} />
          </div>
        </div>

        <div className="rounded-lg border border-ridge-border bg-slate-900/50 p-4 text-center">
          <div className="mb-1 text-xs text-slate-500">Population at Risk</div>
          <div className="font-mono text-3xl font-bold tabular-nums text-risk-high">
            <CountUp value={populationAtRisk} />
          </div>
        </div>
      </div>
    </div>
  )
}
