import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, X, Activity, Cpu, Bell } from 'lucide-react'
import { zones } from '../data/mockData'
import RiskBadge from '../components/RiskBadge'
import WhatIfScenario from '../components/WhatIfScenario'

const statusBadge = {
  Online: 'bg-risk-low/20 text-risk-low border-risk-low/40',
  Degraded: 'bg-risk-moderate/20 text-risk-moderate border-risk-moderate/40',
  Offline: 'bg-risk-critical/20 text-risk-critical border-risk-critical/40',
}

const systemHealth = [
  { label: 'Data Pipeline', status: 'Operational', icon: Activity, uptime: 99.8 },
  { label: 'ML Model', status: 'Operational', icon: Cpu, uptime: 99.5 },
  { label: 'Alert Engine', status: 'Operational', icon: Bell, uptime: 99.9 },
]

type SortKey = 'name' | 'state' | 'riskLevel' | 'lastUpdated' | 'sensorStatus'

export default function Admin() {
  const [sortKey, setSortKey] = useState<SortKey>('riskLevel')
  const [sortAsc, setSortAsc] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const sorted = [...zones].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const cmp = String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin / Ops Console</h1>
          <p className="text-sm text-slate-400">Zone management and system health</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-risk-low px-4 py-2 text-sm font-medium text-black hover:bg-green-400"
        >
          <Plus className="h-4 w-4" /> Add Monitoring Zone
        </button>
      </div>

      <WhatIfScenario />

      {/* System health */}
      <div className="grid gap-4 md:grid-cols-3">
        {systemHealth.map((sys) => (
          <div key={sys.label} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <sys.icon className="h-5 w-5 text-risk-low" />
                <span className="font-medium text-white">{sys.label}</span>
              </div>
              <span className="rounded-full border border-risk-low/40 bg-risk-low/10 px-2 py-0.5 text-xs text-risk-low">
                {sys.status}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-2xl font-bold tabular-nums text-white">{sys.uptime}%</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-1 rounded-sm"
                    style={{
                      background: i < 19 ? '#4ADE80' : '#4ADE8080',
                      height: `${12 + Math.sin(i * 0.8) * 8}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zones table */}
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ridge-border text-left text-slate-400">
                {([
                  ['name', 'Zone Name'],
                  ['state', 'State'],
                  ['riskLevel', 'Risk Level'],
                  ['lastUpdated', 'Last Updated'],
                  ['sensorStatus', 'Sensor Status'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className="cursor-pointer px-4 py-3 hover:text-white"
                    onClick={() => handleSort(key)}
                  >
                    {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((zone) => (
                <tr key={zone.id} className="border-b border-ridge-border/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link to={`/zone/${zone.id}`} className="font-medium text-white hover:text-risk-low">
                      {zone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{zone.state}</td>
                  <td className="px-4 py-3"><RiskBadge level={zone.riskLevel} size="sm" /></td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">{zone.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge[zone.sensorStatus]}`}>
                      {zone.sensorStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add zone modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-md rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Monitoring Zone</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {['Zone Name', 'State', 'Latitude', 'Longitude'].map((label) => (
                <div key={label}>
                  <label className="mb-1 block text-xs text-slate-400">{label}</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-ridge-border bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-risk-low/50 focus:outline-none"
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-ridge-border px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-risk-low px-4 py-2 text-sm font-medium text-black hover:bg-green-400"
                >
                  Add Zone
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
