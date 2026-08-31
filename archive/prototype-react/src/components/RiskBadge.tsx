import { motion } from 'framer-motion'
import type { RiskLevel } from '../utils/riskColors'
import { RISK_COLORS, riskBgClass } from '../utils/riskColors'

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-lg px-5 py-2 font-semibold',
}

export default function RiskBadge({ level, size = 'md', pulse }: RiskBadgeProps) {
  const shouldPulse = pulse ?? level === 'Critical'

  return (
    <motion.span
      className={`inline-flex items-center rounded-full border tabular-nums ${sizeClasses[size]} ${riskBgClass(level)} ${shouldPulse ? 'pulse-critical' : ''}`}
      style={{ borderColor: RISK_COLORS[level] }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <span
        className="mr-1.5 inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: RISK_COLORS[level] }}
      />
      {level}
    </motion.span>
  )
}
