import Dexie, { type Table } from 'dexie'

export interface ScheduleEntry {
  id?: number
  dayOfWeek: number        // 0=Sun … 6=Sat
  eventName: string
  eventTime: string        // "HH:mm"
  prepTime: number         // minutes before event (getting ready)
}

export interface SleepLog {
  id?: number
  date: string             // ISO "YYYY-MM-DD"
  plannedBedtime: string
  actualBedtime: string
  plannedWakeTime: string
  actualWakeTime: string
  sleepQuality: number     // 1-5
  microAwakenings: number
  morningFeeling: number   // 1-5
  notes: string
}

export interface Experiment {
  id?: number
  variable: string
  status: 'baseline' | 'testing' | 'completed'
  baselineStartDate: string
  testingStartDate?: string
  endDate?: string
  baselineDays: number
  testingDays: number
  conclusion?: 'helped' | 'no_effect' | 'hurt'
}

export interface ExperimentLog {
  id?: number
  experimentId: number
  date: string
  applied: boolean
  value?: string
  sleepLogId?: number
}

export interface ActiveGoal {
  id?: number
  goalPath: string[]
  goalLabel: string
  targetMetric: string
  targetValue: string
  targetDirection: 'before' | 'after' | 'within'
  streakRequired: number
  currentStreak: number
  startDate: string
  achieved: boolean
}

export interface UserSettings {
  id?: number
  sleepNeed: number              // minutes (default 540 = 9h)
  sleepOnsetLatency: number      // minutes (default 15)
  routineDuration: number        // minutes (default 60)
  routineSteps: string[]
  notificationsEnabled: boolean
  routineReminderMinutes: number
  bedtimeReminderMinutes: number
}

class SleepTrackerDB extends Dexie {
  scheduleEntries!: Table<ScheduleEntry>
  sleepLogs!: Table<SleepLog>
  experiments!: Table<Experiment>
  experimentLogs!: Table<ExperimentLog>
  activeGoals!: Table<ActiveGoal>
  userSettings!: Table<UserSettings>

  constructor() {
    super('SleepTrackerDB')
    this.version(1).stores({
      scheduleEntries: '++id, dayOfWeek',
      sleepLogs: '++id, &date',
      experiments: '++id, status',
      experimentLogs: '++id, experimentId, date',
      activeGoals: '++id, achieved',
      userSettings: '++id',
    })
  }
}

export const db = new SleepTrackerDB()

// Default settings — upserted on first load
export const DEFAULT_SETTINGS: UserSettings = {
  id: 1,
  sleepNeed: 540,
  sleepOnsetLatency: 15,
  routineDuration: 60,
  routineSteps: ['Shower', 'Floss', 'Brush teeth', 'Read book'],
  notificationsEnabled: false,
  routineReminderMinutes: 60,
  bedtimeReminderMinutes: 15,
}

export async function getSettings(): Promise<UserSettings> {
  const s = await db.userSettings.get(1)
  if (s) return s
  await db.userSettings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function updateSettings(
  patch: Partial<UserSettings>,
): Promise<void> {
  await db.userSettings.update(1, patch)
}
