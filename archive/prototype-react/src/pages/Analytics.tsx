import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis, BarChart, Bar,
} from 'recharts'
import { Download } from 'lucide-react'
import {
  zones, comparisonZones, riskHistory30d, rainfallRiskCorrelation, seasonalHeatmap,
} from '../data/mockData'
import { RISK_COLORS } from '../utils/riskColors'

const lineColors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e', '#eab308']

const comparisonData = (() => {
  const first = riskHistory30d[comparisonZones[0]] ?? []
  return first.map((point, i) => {
    const row: Record<string, string | number> = { time: point.time }
    comparisonZones.forEach((zid) => {
      const z = zones.find((z) => z.id === zid)
      row[z?.name ?? zid] = riskHistory30d[zid]?.[i]?.value ?? 0
    })
    return row
  })
})()

const heatmapColors = RISK_COLORS

export default function Analytics() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Historical Trends</h1>
          <p className="text-sm text-slate-400">30-day risk patterns and correlation analysis</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-ridge-border px-4 py-2 text-sm text-slate-300 hover:border-risk-low hover:text-risk-low">
          <Download className="h-4 w-4" /> Download Report
        </button>
      </div>

      {/* Multi-zone comparison */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="mb-4 font-semibold text-white">Multi-Zone Risk Comparison — 30 Days</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={comparisonData}>
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={4} />
            <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Legend />
            {comparisonZones.map((zid, i) => {
              const z = zones.find((z) => z.id === zid)
              return (
                <Line
                  key={zid}
                  type="monotone"
                  dataKey={z?.name ?? zid}
                  stroke={lineColors[i]}
                  strokeWidth={2}
                  dot={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rainfall vs risk scatter */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-semibold text-white">Rainfall vs. Risk Correlation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis type="number" dataKey="rainfall" name="Rainfall" unit="mm" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis type="number" dataKey="risk" name="Risk" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <ZAxis range={[60, 200]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(value, name) => [value, name === 'risk' ? 'Risk Score' : 'Rainfall (mm)']}
              />
              <Scatter data={rainfallRiskCorrelation} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Seasonal heatmap */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-semibold text-white">Seasonal Risk Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={seasonalHeatmap}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="Low" stackId="a" fill={heatmapColors.Low} />
              <Bar dataKey="Moderate" stackId="a" fill={heatmapColors.Moderate} />
              <Bar dataKey="High" stackId="a" fill={heatmapColors.High} />
              <Bar dataKey="Very High" stackId="a" fill={heatmapColors['Very High']} />
              <Bar dataKey="Critical" stackId="a" fill={heatmapColors.Critical} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {Object.entries(heatmapColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                {level}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
