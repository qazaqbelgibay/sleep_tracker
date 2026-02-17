import { useMemo, useState } from 'react'
import SleepChart from '../components/SleepChart'
import { useSleepLogs } from '../hooks/useSleepData'
import { useSettings } from '../hooks/useSleepData'
import { calculateSleepDebt, consistencyScore, averageQuality, averageMorningFeeling } from '../lib/sleepDebt'

type Range = '7' | '14' | '30'

export default function StatsPage() {
  const [range, setRange] = useState<Range>('7')
  const settings = useSettings()
  const allLogs = useSleepLogs(30)

  const logs = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(range))
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return allLogs.filter((l) => l.date >= cutoffStr)
  }, [allLogs, range])

  const stats = useMemo(() => {
    if (!settings || logs.length === 0) return null

    const sleepMinutes = logs.map((log) => {
      const [bh, bm] = log.actualBedtime.split(':').map(Number)
      const [wh, wm] = log.actualWakeTime.split(':').map(Number)
      const bed = bh * 60 + bm
      let wake = wh * 60 + wm
      if (wake <= bed) wake += 1440
      return wake - bed
    })

    const avgSleepMin = sleepMinutes.reduce((sum, min) => sum + min, 0) / sleepMinutes.length
    const sleepPerformance = Math.max(0, Math.min(100, Math.round((avgSleepMin / settings.sleepNeed) * 100)))
    const avgAwakenings = logs.reduce((sum, l) => sum + l.microAwakenings, 0) / logs.length

    return {
      debt: calculateSleepDebt(logs, settings.sleepNeed),
      consistency: consistencyScore(logs),
      avgQuality: averageQuality(logs),
      avgFeeling: averageMorningFeeling(logs),
      sleepPerformance,
      avgAwakenings,
      totalLogs: logs.length,
    }
  }, [logs, settings])

  return (
    <div className="page animate-in">
      <h1 className="page-title">Statistics</h1>
      <p className="text-sm text-muted mb-3">WHOOP-style trends from your diary data.</p>

      {/* Range selector */}
      <div className="chip-group mb-3">
        {(['7', '14', '30'] as Range[]).map((r) => (
          <button
            key={r}
            className={`chip ${range === r ? 'active' : ''}`}
            onClick={() => setRange(r)}
          >
            {r} days
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="empty-state">
          <p>No sleep logs yet.</p>
          <p>Log your first night to see stats!</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="card text-center">
              <div className="card-title">Sleep Performance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.sleepPerformance >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                {stats.sleepPerformance}%
              </div>
              <div className="text-xs text-muted">need covered</div>
            </div>

            <div className="card text-center">
              <div className="card-title">Sleep Debt</div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: stats.debt > 0 ? 'var(--danger)' : 'var(--success)',
              }}>
                {stats.debt > 0 ? '+' : ''}{(stats.debt / 60).toFixed(1)}h
              </div>
            </div>

            <div className="card text-center">
              <div className="card-title">Consistency</div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: stats.consistency >= 70 ? 'var(--success)' : stats.consistency >= 40 ? 'var(--warning)' : 'var(--danger)',
              }}>
                {stats.consistency}
              </div>
            </div>

            <div className="card text-center">
              <div className="card-title">Avg Quality</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
                {stats.avgQuality.toFixed(1)}
              </div>
              <div className="text-xs text-muted">/ 5</div>
            </div>

            <div className="card text-center">
              <div className="card-title">Avg Morning</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
                {stats.avgFeeling.toFixed(1)}
              </div>
              <div className="text-xs text-muted">/ 5</div>
            </div>

            <div className="card text-center">
              <div className="card-title">Disturbance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.avgAwakenings <= 1 ? 'var(--success)' : 'var(--warning)' }}>
                {stats.avgAwakenings.toFixed(1)}
              </div>
              <div className="text-xs text-muted">wake-ups / night</div>
            </div>
          </div>

          {/* Charts */}
          <div className="card">
            <SleepChart logs={logs} dataKey="duration" color="#818cf8" label="Sleep Duration (hours)" />
          </div>

          <div className="card">
            <SleepChart logs={logs} dataKey="quality" color="#34d399" label="Sleep Quality" />
          </div>

          <div className="card">
            <SleepChart logs={logs} dataKey="feeling" color="#fbbf24" label="Morning Feeling" />
          </div>

          <div className="text-center text-sm text-muted mt-2">
            Based on {stats.totalLogs} logged night{stats.totalLogs !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  )
}
