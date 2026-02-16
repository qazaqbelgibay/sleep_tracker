import { useState, useEffect } from 'react'

interface CountdownResult {
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isPast: boolean
  label: string
}

export function useCountdown(target: Date | null): CountdownResult {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!target) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true, label: '--:--:--' }
  }

  const diff = target.getTime() - now
  const isPast = diff <= 0

  const absDiff = Math.abs(diff)
  const totalSeconds = Math.floor(absDiff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  const label = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return { hours, minutes, seconds, totalMs: diff, isPast, label }
}
