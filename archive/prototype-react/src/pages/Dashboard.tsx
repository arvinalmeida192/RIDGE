import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { MapPin, AlertTriangle, ShieldAlert, RefreshCw, ArrowRight } from 'lucide-react'
import { dashboardStats, riskDistribution, rainfall24hGlobal, alertFeed } from '../data/mockData'
import { newsItems } from '../data/mockNews'
import { SimulatorProvider } from '../context/SimulatorContext'
import MapView from '../components/MapView'
import CountUp from '../components/CountUp'
import RiskBadge from '../components/RiskBadge'
import NewsCard from '../components/NewsCard'

const stats = [
  { label: 'Zones Monitored', value: dashboardStats.totalZones, icon: MapPin, color: 'text-blue-400' },
  { label: 'Active Alerts', value: dashboardStats.activeAlerts, icon: AlertTriangle, color: 'text-risk-very-high' },
  { label: 'High+ Risk Zones', value: dashboardStats.highRiskZones, icon: ShieldAlert, color: 'text-risk-high' },
  { label: 'Last Data Sync', value: 0, icon: RefreshCw, color: 'text-risk-low', text: dashboardStats.lastSync },
]

type FeedTab = 'system' | 'news'

function DashboardContent() {
  const [feedTab, setFeedTab] = useState<FeedTab>('system')
  const compactNews = newsItems.slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
        <p className="text-sm text-slate-400">North Eastern Region — Live Risk Overview</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {stat.text ?? <CountUp value={stat.value} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 3D Map — Earth Globe + Regional Terrain */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl p-4">
            <h2 className="mb-1 font-semibold text-white">NER Risk Map</h2>
            <p className="mb-3 text-xs text-slate-500">
              Interactive 3D Earth with zone overlays · Switch to full 2D map with layers
            </p>
            <MapView height="420px" defaultMode="globe" />
          </div>
        </div>

        {/* Alert / News feed */}
        <div className="glass-panel flex flex-col rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex rounded-lg border border-ridge-border overflow-hidden text-xs">
              <button
                onClick={() => setFeedTab('system')}
                className={`px-3 py-1.5 font-medium transition ${
                  feedTab === 'system'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                System Alerts
              </button>
              <button
                onClick={() => setFeedTab('news')}
                className={`px-3 py-1.5 font-medium transition ${
                  feedTab === 'news'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                News & Advisories
              </button>
            </div>
            {feedTab === 'news' && (
              <Link
                to="/news"
                className="flex items-center gap-1 text-xs text-risk-low hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="h-[420px] space-y-2 overflow-y-auto pr-1">
            {feedTab === 'system' ? (
              alertFeed.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg border border-ridge-border bg-slate-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm text-slate-300">{entry.message}</p>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">{entry.time}</span>
                  </div>
                  <div className="mt-2">
                    <RiskBadge level={entry.riskLevel} size="sm" />
                  </div>
                </motion.div>
              ))
            ) : (
              compactNews.map((item) => (
                <NewsCard key={item.id} item={item} compact />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk distribution */}
        <div className="glass-panel rounded-xl p-4">
          <h2 className="mb-3 font-semibold text-white">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistribution}
                dataKey="count"
                nameKey="level"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {riskDistribution.map((entry) => (
                  <Cell key={entry.level} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3">
            {riskDistribution.map((d) => (
              <div key={d.level} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                {d.level} ({d.count})
              </div>
            ))}
          </div>
        </div>

        {/* Rainfall chart */}
        <div className="glass-panel rounded-xl p-4">
          <h2 className="mb-3 font-semibold text-white">Regional Rainfall — Last 24h</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rainfall24hGlobal}>
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" mm" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  return (
    <SimulatorProvider>
      <DashboardContent />
    </SimulatorProvider>
  )
}
