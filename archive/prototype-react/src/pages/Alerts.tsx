import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Radio, Filter } from 'lucide-react'
import { alerts, nerStates } from '../data/mockData'
import RiskBadge from '../components/RiskBadge'
import type { RiskLevel } from '../utils/riskColors'

const tierColors = {
  Advisory: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  Watch: 'border-risk-moderate/40 bg-risk-moderate/10 text-risk-moderate',
  Warning: 'border-risk-critical/40 bg-risk-critical/10 text-risk-critical',
}

export default function Alerts() {
  const [stateFilter, setStateFilter] = useState<string>('All')
  const [severityFilter, setSeverityFilter] = useState<string>('All')

  const filtered = alerts.filter((a) => {
    if (stateFilter !== 'All' && a.state !== stateFilter) return false
    if (severityFilter !== 'All' && a.riskLevel !== severityFilter) return false
    return true
  })

  const riskLevels: RiskLevel[] = ['Low', 'Moderate', 'High', 'Very High', 'Critical']

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts & Advisories</h1>
        <p className="text-sm text-slate-400">Active warnings across the North Eastern Region</p>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center mr-1">State:</span>
          {['All', ...nerStates].map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                stateFilter === s
                  ? 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                  : 'border border-ridge-border text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center mr-1">Severity:</span>
          {['All', ...riskLevels].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                severityFilter === s
                  ? 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                  : 'border border-ridge-border text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="space-y-4">
        {filtered.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            className="glass-panel rounded-xl p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${tierColors[alert.tier]}`}>
                    {alert.tier}
                  </span>
                  <RiskBadge level={alert.riskLevel} size="sm" />
                </div>
                <h3 className="text-lg font-semibold text-white">{alert.zoneName}, {alert.state}</h3>
                <p className="text-sm text-slate-400">
                  Issued {new Date(alert.issuedAt).toLocaleString('en-IN')} · Affected radius: {alert.affectedRadius} km
                </p>
                <p className="text-sm text-slate-300">{alert.guidance}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-ridge-border px-4 py-2 text-sm text-slate-300 hover:border-risk-low hover:text-risk-low">
                  <Megaphone className="h-4 w-4" /> Notify Authorities
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-risk-high/20 border border-risk-high/40 px-4 py-2 text-sm text-risk-high hover:bg-risk-high/30">
                  <Radio className="h-4 w-4" /> Broadcast to Citizens
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-12">No alerts match the selected filters.</p>
        )}
      </div>
    </motion.div>
  )
}
