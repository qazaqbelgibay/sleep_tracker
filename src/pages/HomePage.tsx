import { useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import CountdownTimer from '../components/CountdownTimer'
import RoutineChecklist from '../components/RoutineChecklist'
import { calculateSleepPlan, formatTime12 } from '../lib/sleepAlgorithm'
import { calculateSleepDebt } from '../lib/sleepDebt'
import { useSettings, useSleepLogs } from '../hooks/useSleepData'
import { useNotifications } from '../hooks/useNotifications'
import { db } from '../db/database'

export default function HomePage() {
  const settings = useSettings()
  const recentLogs = useSleepLogs(7)
  const { permission, requestPermission, scheduleNotification, cancelAll } = useNotifications()

  // Get today's schedule entries
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDay = tomorrow.getDay()

  const tomorrowSchedule = useLiveQuery(
    () => db.scheduleEntries.where('dayOfWeek').equals(tomorrowDay).toArray(),
    [tomorrowDay],
    [],
  )

  // Active goal
  const activeGoal = useLiveQuery(
    () => db.activeGoals.where('achieved').equals(0).first(),
    [],
  )

  // Calculate tonight's sleep plan
  const plan = useMemo(() => {
    if (!settings) return null

    // Find earliest event tomorrow
    let wakeTime = '07:30' // default
    if (tomorrowSchedule.length > 0) {
      const earliest = tomorrowSchedule.reduce((min, e) => {
        const [h, m] = e.eventTime.split(':').map(Number)
        const [mh, mm] = min.eventTime.split(':').map(Number)
        return h * 60 + m - e.prepTime < mh * 60 + mm - min.prepTime ? e : min
      })
      const [eh, em] = earliest.eventTime.split(':').map(Number)
      const wakeMin = eh * 60 + em - earliest.prepTime
      const wH = Math.floor(wakeMin / 60)
      const wM = wakeMin % 60
      wakeTime = `${String(wH).padStart(2, '0')}:${String(wM).padStart(2, '0')}`
    }

    return calculateSleepPlan(
      wakeTime,
      settings.sleepNeed,
      settings.sleepOnsetLatency,
      settings.routineDuration,
      settings.routineSteps,
    )
  }, [settings, tomorrowSchedule])

  // Schedule notifications when plan changes
  useEffect(() => {
    if (!plan || permission !== 'granted') return
    cancelAll()

    scheduleNotification(
      'Start your evening routine',
      `Time to wind down. Bedtime at ${formatTime12(plan.bedtime)}`,
      plan.routineStart,
    )
    scheduleNotification(
      'Bedtime!',
      'Put down the phone and go to sleep.',
      plan.bedtime,
    )
  }, [plan, permission, cancelAll, scheduleNotification])

  // Sleep debt
  const debt = useMemo(() => {
    if (!settings || recentLogs.length === 0) return null
    const debtMin = calculateSleepDebt(recentLogs, settings.sleepNeed)
    return debtMin
  }, [recentLogs, settings])

  return (
    <div className="page animate-in">
      <div style={{ textAlign: 'center', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      <CountdownTimer
        bedtime={plan?.bedtime ?? null}
        routineStart={plan?.routineStart ?? null}
      />

      {/* Tonight's plan summary */}
      {plan && (
        <div className="card">
          <div className="card-title">Tonight's Plan</div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted">Wake-up target</span>
            <span className="font-bold">{formatTime12(plan.wakeTime)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted">Sleep cycles</span>
            <span className="font-bold">{plan.cycles} cycles ({plan.totalInBedMinutes / 60}h in bed)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Source</span>
            <span className="text-sm" style={{ color: tomorrowSchedule.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {tomorrowSchedule.length > 0 ? 'From schedule' : 'Default (set schedule)'}
            </span>
          </div>
        </div>
      )}

      {/* Routine checklist */}
      {plan && <RoutineChecklist steps={plan.routineSteps} />}

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {debt !== null && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title">Sleep Debt</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: debt > 0 ? 'var(--danger)' : 'var(--success)',
            }}>
              {debt > 0 ? '+' : ''}{(debt / 60).toFixed(1)}h
            </div>
            <div className="text-xs text-muted">past 7 days</div>
          </div>
        )}

        {activeGoal && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title">Active Goal</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
              {activeGoal.currentStreak}/{activeGoal.streakRequired}
            </div>
            <div className="text-xs text-muted" style={{ lineHeight: 1.3, marginTop: 4 }}>
              {activeGoal.goalLabel}
            </div>
          </div>
        )}
      </div>

      {/* Notification prompt */}
      {permission === 'default' && (
        <button
          className="btn btn-outline btn-full mt-3"
          onClick={requestPermission}
        >
          Enable bedtime reminders
        </button>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="mt-2">
        <a href="/sleep_tracker/goals" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', color: 'var(--text-secondary)',
          textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
        }}>
          Goals
        </a>
        <a href="/sleep_tracker/settings" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', color: 'var(--text-secondary)',
          textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
        }}>
          Settings
        </a>
      </div>

      {/* Notification prompt */}
      {permission === 'default' && (
        <button
          className="btn btn-outline btn-full mt-3"
          onClick={requestPermission}
        >
          Enable bedtime reminders
        </button>
      )}

      {!plan && (
        <div className="empty-state">
          <p>Loading your sleep plan...</p>
        </div>
      )}
    </div>
  )
}
