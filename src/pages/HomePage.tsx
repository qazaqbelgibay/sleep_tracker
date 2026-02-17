import { useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import CountdownTimer from '../components/CountdownTimer'
import RoutineChecklist from '../components/RoutineChecklist'
import { calculateSleepPlan, formatTime12, formatTime, getWakeTimeForDay } from '../lib/sleepAlgorithm'
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

    const wakeTime = getWakeTimeForDay(tomorrowDay, tomorrowSchedule) ?? '07:30'

    return calculateSleepPlan(
      wakeTime,
      settings.sleepNeed,
      settings.sleepOnsetLatency,
      settings.routineDuration,
      settings.routineSteps,
    )
  }, [settings, tomorrowDay, tomorrowSchedule])

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

  const cbtCoach = useMemo(() => {
    if (!plan) return null
    const now = new Date()
    const bedDeltaMin = Math.round((plan.bedtime.getTime() - now.getTime()) / 60_000)
    const bedtimeLabel = formatTime12(plan.bedtime)

    if (bedDeltaMin <= -30) {
      return {
        title: 'Missed planned bedtime',
        action: 'CBT-I move: avoid sleeping in tomorrow. Keep your wake-up target and restart the routine earlier tonight.',
        tone: 'var(--danger)',
      }
    }

    if (bedDeltaMin <= 20) {
      return {
        title: 'Wind-down now',
        action: `You are in the sleep window for ${bedtimeLabel}. Keep lights low, no doom-scrolling, and only go to bed when sleepy.`,
        tone: 'var(--warning)',
      }
    }

    return {
      title: 'Protect your sleep window',
      action: `Target bedtime is ${bedtimeLabel}. If you are not sleepy yet, do a calm activity and enter bed only when drowsy (CBT-I stimulus control).`,
      tone: 'var(--accent)',
    }
  }, [plan])

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
          <div className="text-xs text-muted mt-2">
            Tonight is planned from {new Date().toLocaleDateString('en-US', { weekday: 'short' })} schedule for tomorrow ({formatTime(plan.wakeTime)} wake target).
          </div>
        </div>
      )}

      {cbtCoach && (
        <div className="card coach-card">
          <div className="card-title">CBT-I Coach</div>
          <div style={{ fontWeight: 700, color: cbtCoach.tone, marginBottom: 6 }}>{cbtCoach.title}</div>
          <div className="text-sm" style={{ lineHeight: 1.4 }}>{cbtCoach.action}</div>
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
