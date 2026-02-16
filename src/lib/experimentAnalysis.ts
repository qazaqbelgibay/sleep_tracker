import type { SleepLog, ExperimentLog } from '../db/database'

export interface ExperimentResult {
  baselineAvgQuality: number
  testingAvgQuality: number
  baselineAvgFeeling: number
  testingAvgFeeling: number
  baselineAvgSleepMin: number
  testingAvgSleepMin: number
  qualityDelta: number
  feelingDelta: number
  verdict: 'helped' | 'no_effect' | 'hurt'
}

/**
 * Analyze an experiment by comparing baseline vs testing period sleep logs.
 *
 * @param baselineLogs ExperimentLog entries from baseline period
 * @param testingLogs  ExperimentLog entries from testing period
 * @param allSleepLogs All sleep logs (to join by date)
 */
export function analyzeExperiment(
  baselineLogs: ExperimentLog[],
  testingLogs: ExperimentLog[],
  allSleepLogs: SleepLog[],
): ExperimentResult | null {
  const sleepByDate = new Map<string, SleepLog>()
  for (const sl of allSleepLogs) {
    sleepByDate.set(sl.date, sl)
  }

  const baselineSleep = baselineLogs
    .map((el) => sleepByDate.get(el.date))
    .filter((s): s is SleepLog => s !== undefined)

  const testingSleep = testingLogs
    .map((el) => sleepByDate.get(el.date))
    .filter((s): s is SleepLog => s !== undefined)

  if (baselineSleep.length === 0 || testingSleep.length === 0) return null

  const avg = (logs: SleepLog[], key: keyof SleepLog) => {
    const vals = logs.map((l) => l[key] as number)
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }

  const baselineAvgQuality = avg(baselineSleep, 'sleepQuality')
  const testingAvgQuality = avg(testingSleep, 'sleepQuality')
  const baselineAvgFeeling = avg(baselineSleep, 'morningFeeling')
  const testingAvgFeeling = avg(testingSleep, 'morningFeeling')

  // Sleep duration
  const avgDuration = (logs: SleepLog[]) => {
    return logs.reduce((s, l) => {
      const bed = timeToMin(l.actualBedtime)
      let wake = timeToMin(l.actualWakeTime)
      if (bed > wake) wake += 1440
      return s + (wake - bed)
    }, 0) / logs.length
  }

  const baselineAvgSleepMin = avgDuration(baselineSleep)
  const testingAvgSleepMin = avgDuration(testingSleep)

  const qualityDelta = testingAvgQuality - baselineAvgQuality
  const feelingDelta = testingAvgFeeling - baselineAvgFeeling

  // Verdict: if combined improvement > 0.3 points on 1-5 scale → helped
  const combinedDelta = (qualityDelta + feelingDelta) / 2
  let verdict: 'helped' | 'no_effect' | 'hurt'
  if (combinedDelta > 0.3) verdict = 'helped'
  else if (combinedDelta < -0.3) verdict = 'hurt'
  else verdict = 'no_effect'

  return {
    baselineAvgQuality,
    testingAvgQuality,
    baselineAvgFeeling,
    testingAvgFeeling,
    baselineAvgSleepMin,
    testingAvgSleepMin,
    qualityDelta,
    feelingDelta,
    verdict,
  }
}

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
