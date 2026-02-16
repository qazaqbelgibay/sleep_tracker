import type { SleepLog } from '../db/database'
import { parseTime } from './sleepAlgorithm'

/**
 * Calculate actual sleep minutes from a log entry.
 * Handles overnight sleep (bedtime PM → wake AM).
 */
export function actualSleepMinutes(log: SleepLog): number {
  const bed = parseTime(log.actualBedtime)
  const wake = parseTime(log.actualWakeTime)

  let bedMin = bed.hours * 60 + bed.minutes
  let wakeMin = wake.hours * 60 + wake.minutes

  // If bedtime is later in the day than wake time, it's overnight
  if (bedMin > wakeMin) {
    wakeMin += 24 * 60
  }

  return wakeMin - bedMin
}

/**
 * Calculate sleep debt for a series of logs.
 * Debt = sum of (sleepNeed - actualSleep) for each night.
 * Positive = debt (under-slept), negative = surplus.
 */
export function calculateSleepDebt(
  logs: SleepLog[],
  sleepNeedMinutes: number,
): number {
  let debt = 0
  for (const log of logs) {
    const actual = actualSleepMinutes(log)
    debt += sleepNeedMinutes - actual
  }
  return debt
}

/**
 * Sleep consistency score (0-100).
 * Measures how consistent bedtimes and wake times are across logs.
 * Lower variance = higher score.
 */
export function consistencyScore(logs: SleepLog[]): number {
  if (logs.length < 2) return 100

  const bedtimes = logs.map((l) => {
    const { hours, minutes } = parseTime(l.actualBedtime)
    let m = hours * 60 + minutes
    // Normalize: if before noon, add 24h (it's after midnight)
    if (m < 720) m += 1440
    return m
  })

  const wakeTimes = logs.map((l) => {
    const { hours, minutes } = parseTime(l.actualWakeTime)
    return hours * 60 + minutes
  })

  const bedStdDev = stdDev(bedtimes)
  const wakeStdDev = stdDev(wakeTimes)
  const avgDev = (bedStdDev + wakeStdDev) / 2

  // Map deviation to 0-100 score (0 dev = 100, 120+ min dev = 0)
  return Math.max(0, Math.min(100, Math.round(100 - (avgDev / 120) * 100)))
}

/**
 * Average sleep quality from logs.
 */
export function averageQuality(logs: SleepLog[]): number {
  if (logs.length === 0) return 0
  const sum = logs.reduce((s, l) => s + l.sleepQuality, 0)
  return sum / logs.length
}

/**
 * Average morning feeling from logs.
 */
export function averageMorningFeeling(logs: SleepLog[]): number {
  if (logs.length === 0) return 0
  const sum = logs.reduce((s, l) => s + l.morningFeeling, 0)
  return sum / logs.length
}

function stdDev(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  return Math.sqrt(variance)
}
