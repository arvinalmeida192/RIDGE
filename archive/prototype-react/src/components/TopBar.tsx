import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'

export default function TopBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ridge-border bg-ridge-bg/80 px-6 backdrop-blur-xl">
      <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white lg:hidden">
        <Mountain className="h-6 w-6 text-risk-low" />
        <span className="font-bold text-white">RIDGE</span>
      </Link>

      <div className="hidden flex-1 lg:block" />

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm font-medium tabular-nums text-white">
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-xs tabular-nums text-slate-400">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>
    </header>
  )
}
