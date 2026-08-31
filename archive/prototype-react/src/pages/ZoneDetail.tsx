import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  ArrowLeft, Droplets, Mountain, Activity, Gauge, TrendingUp,
  CheckCircle2, Car, Megaphone, Tent, Users, Radio,
  AlertTriangle, Route, Wheat,
} from 'lucide-react'
import {
  getZoneById, riskTrajectory24h, historicalIncidents, recommendedActions,
  getZoneExposure, getZoneCausativeFactors, getSeverityTier,
} from '../data/mockData'
import RiskBadge from '../components/RiskBadge'
import { RISK_COLORS } from '../utils/riskColors'

const actionIcons: Record<string, typeof Car> = {
  traffic: Car,
  warn: Megaphone,
  evacuate: Tent,
  deploy: Users,
  monitor: Radio,
}

const factorConfig = [
  { key: 'rainfall24h', label: 'Rainfall (24h)', unit: 'mm', max: 200, icon: Droplets },
  { key: 'cumulativeRainfall', label: 'Antecedent Rainfall', unit: 'mm', max: 500, icon: Droplets },
  { key: 'soilSaturation', label: 'Soil Saturation', unit: '%', max: 100, icon: Gauge },
  { key: 'slopeAngle', label: 'Slope Angle', unit: '°', max: 50, icon: Mountain },
  { key: 'seismicIndex', label: 'Seismic Activity', unit: '', max: 1, icon: Activity },
  { key: 'groundMovement', label: 'Ground Movement', unit: 'mm/day', max: 10, icon: TrendingUp },
] as const

export default function ZoneDetail() {
  const { id } = useParams<{ id: string }>()
  const zone = getZoneById(id ?? '')

  if (!zone) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Zone not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-risk-low hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  const trajectory = riskTrajectory24h[zone.id] ?? []
  const incidents = historicalIncidents[zone.id] ?? []
  const exposure = getZoneExposure(zone.id)
  const causativeFactors = getZoneCausativeFactors(zone.id)
  const severityTier = exposure ? getSeverityTier(zone.riskLevel, exposure) : null

  const severityColors: Record<string, string> = {
    Localized: 'text-risk-low border-risk-low/40 bg-risk-low/10',
    Moderate: 'text-risk-moderate border-risk-moderate/40 bg-risk-moderate/10',
    Severe: 'text-risk-high border-risk-high/40 bg-risk-high/10',
    Catastrophic: 'text-risk-critical border-risk-critical/40 bg-risk-critical/10',
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-xl p-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{zone.name}</h1>
          <p className="text-slate-400">{zone.state} · {zone.lat.toFixed(4)}°N, {zone.lng.toFixed(4)}°E</p>
        </div>
        <RiskBadge level={zone.riskLevel} size="lg" />
      </div>

      {/* Risk Trajectory — standout feature */}
      <div className="glass-panel rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Risk Trajectory — 24h Forecast</h2>
            <p className="text-sm text-slate-400">Score with confidence band and tier thresholds</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">ML Confidence</div>
            <div className="text-2xl font-bold tabular-nums text-risk-low">{zone.mlConfidence}%</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trajectory}>
            <defs>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={3} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <ReferenceLine y={1} stroke={RISK_COLORS.Low} strokeDasharray="3 3" label={{ value: 'Low', fill: RISK_COLORS.Low, fontSize: 10 }} />
            <ReferenceLine y={2} stroke={RISK_COLORS.Moderate} strokeDasharray="3 3" label={{ value: 'Mod', fill: RISK_COLORS.Moderate, fontSize: 10 }} />
            <ReferenceLine y={3} stroke={RISK_COLORS.High} strokeDasharray="3 3" label={{ value: 'High', fill: RISK_COLORS.High, fontSize: 10 }} />
            <ReferenceLine y={4} stroke={RISK_COLORS['Very High']} strokeDasharray="3 3" label={{ value: 'V.High', fill: RISK_COLORS['Very High'], fontSize: 10 }} />
            <ReferenceLine y={5} stroke={RISK_COLORS.Critical} strokeDasharray="3 3" label={{ value: 'Crit', fill: RISK_COLORS.Critical, fontSize: 10 }} />
            <Area type="monotone" dataKey="confidenceHigh" stroke="none" fill="url(#confidenceBand)" />
            <Area type="monotone" dataKey="confidenceLow" stroke="none" fill="#0B0F14" />
            <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} fill="none" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Predicted Impact & Exposure */}
      {exposure && severityTier && (
        <div className="glass-panel rounded-xl border-l-4 border-l-risk-high p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <AlertTriangle className="h-5 w-5 text-risk-high" />
                Predicted Impact &amp; Exposure
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Estimated consequences if a landslide occurs at current risk level
              </p>
            </div>
            <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${severityColors[severityTier]}`}>
              {severityTier}
            </span>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-4 text-center">
              <div className="text-2xl font-bold tabular-nums text-white">
                {exposure.estimatedPopulationInRadius.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400">Population in impact radius</div>
            </div>
            <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-4 text-center">
              <div className="text-2xl font-bold tabular-nums text-white">
                {exposure.estimatedStructuresAtRisk}
              </div>
              <div className="text-xs text-slate-400">Structures at risk</div>
            </div>
            <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-4 text-center">
              <div className="text-2xl font-bold tabular-nums text-white">
                {exposure.roadNetworkLengthAtRiskKm} km
              </div>
              <div className="text-xs text-slate-400">Road network at risk</div>
            </div>
          </div>

          <h3 className="mb-3 text-sm font-medium text-slate-300">What&apos;s in the path</h3>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {exposure.roads.map((road) => (
              <div key={road.name} className="flex items-start gap-3 rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                <Route className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <div className="text-sm text-white">{road.name}</div>
                  <div className="text-xs text-slate-400">{road.lengthKm} km stretch</div>
                </div>
              </div>
            ))}
            {exposure.settlements.map((s) => (
              <div key={s.name} className="flex items-start gap-3 rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <div className="text-sm text-white">{s.name}</div>
                  <div className="text-xs text-slate-400">approx. {s.population.toLocaleString('en-IN')} residents</div>
                </div>
              </div>
            ))}
            {exposure.infrastructure.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div className="text-sm text-white">{item}</div>
              </div>
            ))}
            {exposure.agriculturalLandHectares > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                <Wheat className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <div className="text-sm text-white">Agricultural land</div>
                  <div className="text-xs text-slate-400">approx. {exposure.agriculturalLandHectares} hectares</div>
                </div>
              </div>
            )}
          </div>

          {causativeFactors.length > 0 && (
            <>
              <h3 className="mb-3 text-sm font-medium text-slate-300">Why this zone is at risk</h3>
              <div className="space-y-3">
                {causativeFactors.map((cf, i) => (
                  <div key={cf.factor}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-300">
                        <span className="mr-2 text-xs text-slate-500">{i + 1}.</span>
                        {cf.factor}
                      </span>
                      <span className="tabular-nums text-white">{cf.contributionPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-risk-moderate to-risk-high"
                        initial={{ width: 0 }}
                        animate={{ width: `${cf.contributionPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contributing factors */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-semibold text-white">Contributing Factors</h2>
          <div className="space-y-4">
            {factorConfig.map(({ key, label, unit, max, icon: Icon }) => {
              const val = zone[key] as number
              const pct = Math.min(100, (val / max) * 100)
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Icon className="h-4 w-4 text-slate-500" /> {label}
                    </span>
                    <span className="tabular-nums text-white">{val}{unit}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-risk-high"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommended actions */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-semibold text-white">Recommended Actions</h2>
          <ul className="space-y-3">
            {recommendedActions.map((action) => {
              const Icon = actionIcons[action.icon] ?? CheckCircle2
              return (
                <li key={action.text} className="flex items-start gap-3 rounded-lg border border-ridge-border bg-slate-900/40 p-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-risk-low" />
                  <span className="text-sm text-slate-300">{action.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Historical incidents */}
      {incidents.length > 0 && (
        <div className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-semibold text-white">Historical Incidents</h2>
          <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-ridge-border">
            {incidents.map((inc) => (
              <div key={inc.date} className="relative">
                <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-risk-high bg-ridge-bg" />
                <div className="text-xs text-slate-500">{inc.date}</div>
                <div className="text-sm text-slate-300">{inc.event}</div>
                <RiskBadge level={inc.severity} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
