import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SleepLog, type ScheduleEntry, type UserSettings, getSettings } from '../db/database'
import { useState, useEffect } from 'react'

export function useSleepLogs(limit: number = 30): SleepLog[] {
  return useLiveQuery(
    () => db.sleepLogs.orderBy('date').reverse().limit(limit).toArray(),
    [limit],
    [],
  )
}

export function useScheduleForDay(dayOfWeek: number): ScheduleEntry[] {
  return useLiveQuery(
    () => db.scheduleEntries.where('dayOfWeek').equals(dayOfWeek).toArray(),
    [dayOfWeek],
    [],
  )
}

export function useAllSchedule(): ScheduleEntry[] {
  return useLiveQuery(() => db.scheduleEntries.toArray(), [], [])
}

export function useSettings(): UserSettings | null {
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const live = useLiveQuery(() => db.userSettings.get(1), [])
  useEffect(() => {
    if (live) setSettings(live)
  }, [live])

  return settings
}

export function useSleepLogsRange(startDate: string, endDate: string): SleepLog[] {
  return useLiveQuery(
    () =>
      db.sleepLogs
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray(),
    [startDate, endDate],
    [],
  )
}
