import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { SleepLog } from '../db/database'
import { actualSleepMinutes } from '../lib/sleepDebt'

interface Props {
  logs: SleepLog[]
  dataKey: 'duration' | 'quality' | 'feeling'
  color?: string
  label?: string
}

export default function SleepChart({ logs, dataKey, color = '#818cf8', label }: Props) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <p>No data yet. Start logging your sleep!</p>
      </div>
    )
  }

  const data = [...logs].reverse().map((log) => {
    const duration = actualSleepMinutes(log)
    return {
      date: log.date.slice(5), // "MM-DD"
      duration: +(duration / 60).toFixed(1),
      quality: log.sleepQuality,
      feeling: log.morningFeeling,
    }
  })

  const yDomain = dataKey === 'duration' ? [0, 12] : [0, 5]

  return (
    <div>
      {label && <div className="card-title">{label}</div>}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis domain={yDomain} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
