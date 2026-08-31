import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap, RotateCcw, ArrowDown, AlertTriangle, Users, TrendingUp,
} from 'lucide-react'
import {
  SCENARIO_PARAM_META,
  DEFAULT_CONDITIONS,
  computeScenarioResults,
  hasActiveConditions,
  type ScenarioConditions,
} from '../utils/scenarioSimulator'
import CountUp from './CountUp'
import RiskBadge from './RiskBadge'
import { RISK_COLORS } from '../utils/riskColors'

type NumericParamKey = typeof SCENARIO_PARAM_META[number]['key']

function formatParamDisplay(
  key: NumericParamKey,
  value: number,
  unit: string,
): string {
  if (key === 'earthquakeMagnitude') return `M${value.toFixed(1)}`
  if (key === 'soilMoisturePercent') return `+${value}${unit}`
  return `+${value}${unit}`
}

export default function WhatIfScenario() {
  const [conditions, setConditions] = useState<ScenarioConditions>({ ...DEFAULT_CONDITIONS })
  const [runKey, setRunKey] = useState(0)

  const results = useMemo(
    () => computeScenarioResults(conditions),
    [conditions, runKey],
  )

  const active = hasActiveConditions(conditions)

  function setParam(key: NumericParamKey, value: number) {
    setConditions((prev) => ({ ...prev, [key]: value }))
  }

  function setPreset(key: NumericParamKey, value: number) {
    setConditions((prev) => ({ ...prev, [key]: value }))
  }

  function reset() {
    setConditions({ ...DEFAULT_CONDITIONS })
    setRunKey((k) => k + 1)
  }

  function rerun() {
    setRunKey((k) => k + 1)
  }

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-risk-high/25">
      {/* Header */}
      <div className="border-b border-ridge-border bg-gradient-to-r from-risk-high/10 via-slate-900/50 to-transparent px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-risk-high">
              <Zap className="h-3.5 w-3.5" />
              Disaster Simulation
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              WHAT IF…?
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Adjust hazard parameters and combine conditions to simulate cascading regional impact
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-ridge-border px-3 py-2 text-xs text-slate-400 transition hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={rerun}
              disabled={!active}
              className="flex items-center gap-1.5 rounded-lg bg-risk-high px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-500 disabled:opacity-40"
            >
              <Zap className="h-3.5 w-3.5" />
              Run Scenario
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
        {/* Adjustable parameters */}
        <div className="border-b border-ridge-border p-5 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Scenario Parameters
          </p>
          <div className="space-y-4">
            {SCENARIO_PARAM_META.map((meta) => {
              const value = conditions[meta.key]
              const isOn = value > 0

              return (
                <div
                  key={meta.key}
                  className={`rounded-xl border p-4 transition ${
                    isOn
                      ? 'border-risk-high/50 bg-risk-high/10'
                      : 'border-ridge-border bg-slate-900/30'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-sm font-medium text-white">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold tabular-nums ${isOn ? 'text-risk-high' : 'text-slate-500'}`}>
                        {value > 0 ? formatParamDisplay(meta.key, value, meta.unit) : 'Off'}
                      </span>
                      <button
                        onClick={() => setPreset(meta.key, isOn ? 0 : meta.defaultValue)}
                        className={`rounded border px-1.5 py-0.5 text-[10px] transition ${
                          isOn
                            ? 'border-slate-600 text-slate-400 hover:text-white'
                            : 'border-risk-high/40 text-risk-high hover:bg-risk-high/10'
                        }`}
                        title={isOn ? 'Turn off' : `Set to default (${meta.defaultValue})`}
                      >
                        {isOn ? 'Off' : 'On'}
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={value}
                    onChange={(e) => setParam(meta.key, Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-risk-high"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                    <span>{meta.min}{meta.unit}</span>
                    <span className="text-slate-600">default: {meta.defaultValue}{meta.unit}</span>
                    <span>{meta.max}{meta.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Results pipeline */}
        <div className="p-5">
          {!active ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-slate-500">
              <Zap className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm">Adjust one or more parameters to simulate disaster impact</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={runKey + JSON.stringify(conditions)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Baseline → Conditions → Result flow */}
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                  <div className="rounded-xl border border-ridge-border bg-slate-900/50 p-4 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Baseline</div>
                    <div className="mt-2 font-mono text-4xl font-black tabular-nums text-white">
                      <CountUp value={results.baselineHighRisk} />
                    </div>
                    <div className="text-xs text-slate-400">high-risk zones</div>
                    <div className="mt-2 font-mono text-sm text-slate-500">
                      {results.baselineElevated} elevated
                    </div>
                  </div>

                  <ArrowDown className="mx-auto hidden h-5 w-5 text-slate-600 md:block md:rotate-[-90deg]" />

                  <div className="rounded-xl border border-risk-high/30 bg-risk-high/5 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-risk-high">Conditions</div>
                    <ul className="mt-2 space-y-1">
                      {results.activeConditions.map((c) => (
                        <li key={c} className="font-mono text-xs text-slate-300">✓ {c}</li>
                      ))}
                    </ul>
                  </div>

                  <ArrowDown className="mx-auto hidden h-5 w-5 text-risk-high md:block md:rotate-[-90deg]" />

                  <div className="rounded-xl border-2 border-risk-high/50 bg-risk-high/10 p-4 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-risk-high">Simulated Result</div>
                    <div
                      className="mt-2 font-mono text-4xl font-black tabular-nums"
                      style={{ color: RISK_COLORS[results.regionalTier] }}
                    >
                      <CountUp value={results.simulatedHighRisk} />
                    </div>
                    <div className="text-xs text-slate-300">high-risk zones</div>
                    <div className="mt-2">
                      <span
                        className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                        style={{
                          color: RISK_COLORS[results.regionalTier],
                          borderColor: `${RISK_COLORS[results.regionalTier]}66`,
                          backgroundColor: `${RISK_COLORS[results.regionalTier]}18`,
                        }}
                      >
                        {results.regionalTier} regional tier
                      </span>
                    </div>
                  </div>
                </div>

                {/* Impact metrics */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <TrendingUp className="h-3.5 w-3.5" /> Newly high-risk
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-risk-high">
                      +<CountUp value={results.newlyHighRisk.length} />
                    </div>
                    <div className="text-[10px] text-slate-500">zones escalated to High+</div>
                  </div>
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" /> Population at risk
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-white">
                      <CountUp value={results.populationAtRisk} />
                    </div>
                    {results.populationDelta > 0 && (
                      <div className="text-[10px] text-risk-high">+{results.populationDelta.toLocaleString('en-IN')} vs baseline</div>
                    )}
                  </div>
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <AlertTriangle className="h-3.5 w-3.5" /> Risk escalations
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-white">
                      <CountUp value={results.escalatedZones.length} />
                    </div>
                    <div className="text-[10px] text-slate-500">zones changed tier</div>
                  </div>
                </div>

                {results.newlyHighRisk.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Newly Affected Zones
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.newlyHighRisk.map((s) => (
                        <Link
                          key={s.zone.id}
                          to={`/zone/${s.zone.id}`}
                          className="flex items-center gap-2 rounded-lg border border-risk-high/30 bg-risk-high/10 px-3 py-1.5 text-sm transition hover:bg-risk-high/20"
                        >
                          <span className="text-white">{s.zone.name}</span>
                          <RiskBadge level={s.riskLevel} size="sm" />
                          <span className="font-mono text-xs text-risk-high">+{s.scoreDelta}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
