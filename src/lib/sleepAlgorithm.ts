/**
 * Core sleep algorithm — calculates optimal bedtime, routine start,
 * and sleep-cycle alignment based on schedule and user settings.
 */

export interface SleepPlan {
  wakeTime: Date
  bedtime: Date
  routineStart: Date
  sleepOnset: Date          // bedtime + onset latency
  totalInBedMinutes: number
  cycles: number            // number of full 90-min cycles
  routineSteps: RoutineStep[]
}

export interface RoutineStep {
  label: string
  startTime: Date
}

const CYCLE_MINUTES = 90

/**
 * Parse "HH:mm" into { hours, minutes }
 */
export function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number)
  return { hours: h, minutes: m }
}

/**
 * Create a Date for today (or tomorrow) at a given HH:mm.
 * If the resulting time is in the past, it rolls to tomorrow.
 */
export function timeToday(hhmm: string, referenceDate?: Date): Date {
  const ref = referenceDate ?? new Date()
  const { hours, minutes } = parseTime(hhmm)
  const d = new Date(ref)
  d.setHours(hours, minutes, 0, 0)
  return d
}

/**
 * Calculate the optimal sleep plan.
 *
 * @param wakeTimeStr  "HH:mm" — when you need to wake up
 * @param sleepNeed    total minutes of in-bed time needed (default 540 = 9h)
 * @param onsetLatency minutes to fall asleep (default 15)
 * @param routineDuration minutes for evening routine (default 60)
 * @param routineSteps labels for each routine step
 * @param referenceDate date context (defaults to now)
 */
export function calculateSleepPlan(
  wakeTimeStr: string,
  sleepNeed: number = 540,
  onsetLatency: number = 15,
  routineDuration: number = 60,
  routineSteps: string[] = ['Shower', 'Floss', 'Brush teeth', 'Read book'],
  referenceDate?: Date,
): SleepPlan {
  const now = referenceDate ?? new Date()

  // Build wake time as a future Date
  let wakeTime = timeToday(wakeTimeStr, now)
  // If wake time is earlier than now, it must be tomorrow
  if (wakeTime.getTime() <= now.getTime()) {
    wakeTime = new Date(wakeTime.getTime() + 24 * 60 * 60_000)
  }

  // Work backward: bedtime = wakeTime - sleepNeed - onsetLatency
  const bedtime = new Date(
    wakeTime.getTime() - (sleepNeed + onsetLatency) * 60_000,
  )
  const sleepOnset = new Date(bedtime.getTime() + onsetLatency * 60_000)

  // Align to 90-minute sleep cycles (from sleep onset to wake)
  const sleepMinutes = (wakeTime.getTime() - sleepOnset.getTime()) / 60_000
  const cycles = Math.round(sleepMinutes / CYCLE_MINUTES)

  // Routine starts before bedtime
  const routineStart = new Date(bedtime.getTime() - routineDuration * 60_000)

  // Distribute routine steps evenly across routine duration
  const stepDuration =
    routineSteps.length > 0 ? routineDuration / routineSteps.length : 0
  const steps: RoutineStep[] = routineSteps.map((label, i) => ({
    label,
    startTime: new Date(routineStart.getTime() + i * stepDuration * 60_000),
  }))

  return {
    wakeTime,
    bedtime,
    routineStart,
    sleepOnset,
    totalInBedMinutes: sleepNeed,
    cycles,
    routineSteps: steps,
  }
}

/**
 * Get today's wake time from schedule entries.
 * Returns the earliest event of the day minus its prep time.
 */
export function getWakeTimeForDay(
  _dayOfWeek: number,
  entries: { eventTime: string; prepTime: number }[],
): string | null {
  const dayEntries = entries.filter(() => true) // all entries for this day
  if (dayEntries.length === 0) return null

  // Find earliest event
  let earliestMinutes = Infinity
  let bestWake = ''
  for (const e of dayEntries) {
    const { hours, minutes } = parseTime(e.eventTime)
    const total = hours * 60 + minutes - e.prepTime
    if (total < earliestMinutes) {
      earliestMinutes = total
      const wH = Math.floor(total / 60)
      const wM = total % 60
      bestWake = `${String(wH).padStart(2, '0')}:${String(wM).padStart(2, '0')}`
    }
  }
  return bestWake
}

/**
 * Format a Date as "HH:mm"
 */
export function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Format a Date as "h:mm AM/PM"
 */
export function formatTime12(d: Date): string {
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * Milliseconds between now and a target time.
 * Returns 0 if target is in the past.
 */
export function msUntil(target: Date): number {
  return Math.max(0, target.getTime() - Date.now())
}
