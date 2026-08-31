import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface CountUpProps {
  value: number
  suffix?: string
  className?: string
}

export default function CountUp({ value, suffix = '', className = '' }: CountUpProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [text, setText] = useState('0')

  useEffect(() => {
    spring.set(value)
    const unsub = display.on('change', (v) => setText(String(v)))
    return unsub
  }, [value, spring, display])

  return (
    <motion.span className={`tabular-nums ${className}`}>
      {text}{suffix}
    </motion.span>
  )
}
