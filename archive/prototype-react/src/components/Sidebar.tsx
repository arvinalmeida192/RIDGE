import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Bell,
  BarChart3,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Newspaper,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin', icon: Settings, label: 'Admin' },
  { to: '/about', icon: Info, label: 'About' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-ridge-border bg-ridge-card/90 backdrop-blur-xl"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-ridge-border px-4">
        <Mountain className="h-8 w-8 shrink-0 text-risk-low" />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-lg font-bold tracking-tight text-white">RIDGE</div>
            <div className="text-[10px] text-slate-400">Geohazard Intelligence</div>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-risk-low/10 text-risk-low border border-risk-low/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-ridge-border p-3 space-y-1">
        {!collapsed && user && (
          <div className="mb-2 px-3 text-[10px] uppercase tracking-wider text-slate-500">
            Signed in as {user.username}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-risk-high"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg border border-ridge-border p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  )
}
