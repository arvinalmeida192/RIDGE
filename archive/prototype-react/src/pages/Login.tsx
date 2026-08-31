import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mountain, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { validateCredentials, type UserRole } from '../utils/mockAuth'

function RainParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-4 w-px bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"
          style={{ left: `${(i * 3.3) % 100}%`, top: -20 }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, role } = useAuth()
  const [portal, setPortal] = useState<UserRole>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    const dest = role === 'admin' ? '/dashboard' : '/citizen'
    return <Navigate to={dest} replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const authenticated = validateCredentials(username, password)
    if (!authenticated) {
      setError('Invalid credentials, please try again')
      return
    }
    if (authenticated.role !== portal) {
      setError(`Please use the ${authenticated.role === 'admin' ? 'Admin' : 'Citizen'} portal for these credentials`)
      return
    }
    const result = login(username, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(authenticated.role === 'admin' ? '/dashboard' : '/citizen')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center topo-bg px-4 text-slate-200">
      <RainParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <Mountain className="h-10 w-10 text-risk-low" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">RIDGE</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Risk Intelligence for Dynamic Geohazard Evaluation
          </p>
          <p className="mt-2 text-xs text-slate-500">
            AI-powered landslide early warning for India's North Eastern Region
          </p>
        </div>

        {/* Login card */}
        <div className="glass-panel rounded-2xl p-8 shadow-xl shadow-black/20">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">Sign in to your portal</h2>

          {/* Role tabs */}
          <div className="mb-6 flex rounded-lg border border-ridge-border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => { setPortal('admin'); setError('') }}
              className={`flex-1 py-2.5 font-medium transition ${
                portal === 'admin'
                  ? 'bg-risk-low/15 text-risk-low'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => { setPortal('citizen'); setError('') }}
              className={`flex-1 py-2.5 font-medium transition ${
                portal === 'citizen'
                  ? 'bg-risk-low/15 text-risk-low'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              Citizen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm text-slate-400">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                className="w-full rounded-lg border border-ridge-border bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-risk-low/50 focus:ring-1 focus:ring-risk-low/30"
                placeholder={portal === 'admin' ? 'admin' : 'user'}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                className="w-full rounded-lg border border-ridge-border bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-risk-low/50 focus:ring-1 focus:ring-risk-low/30"
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-risk-low py-2.5 font-semibold text-black transition hover:bg-green-400"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Demo credentials — Admin: <span className="text-slate-400">admin / admin</span>
            {' · '}
            Citizen: <span className="text-slate-400">user / user</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
