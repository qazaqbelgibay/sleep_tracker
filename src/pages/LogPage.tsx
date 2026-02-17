import { useState, useEffect } from 'react'
import { db, type SleepLog } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'

export default function LogPage() {
  const today = new Date().toISOString().slice(0, 10)

  const existingLog = useLiveQuery(
    () => db.sleepLogs.where('date').equals(today).first(),
    [today],
  )

  const [plannedBedtime, setPlannedBedtime] = useState('22:30')
  const [actualBedtime, setActualBedtime] = useState('22:30')
  const [plannedWakeTime, setPlannedWakeTime] = useState('07:30')
  const [actualWakeTime, setActualWakeTime] = useState('07:30')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [microAwakenings, setMicroAwakenings] = useState(0)
  const [morningFeeling, setMorningFeeling] = useState(3)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  // Pre-fill if editing existing log
  useEffect(() => {
    if (existingLog) {
      setPlannedBedtime(existingLog.plannedBedtime)
      setActualBedtime(existingLog.actualBedtime)
      setPlannedWakeTime(existingLog.plannedWakeTime)
      setActualWakeTime(existingLog.actualWakeTime)
      setSleepQuality(existingLog.sleepQuality)
      setMicroAwakenings(existingLog.microAwakenings)
      setMorningFeeling(existingLog.morningFeeling)
      setNotes(existingLog.notes)
    }
  }, [existingLog])

  const handleSave = async () => {
    const log: SleepLog = {
      date: today,
      plannedBedtime,
      actualBedtime,
      plannedWakeTime,
      actualWakeTime,
      sleepQuality,
      microAwakenings,
      morningFeeling,
      notes,
    }

    if (existingLog?.id) {
      await db.sleepLogs.update(existingLog.id, log)
    } else {
      await db.sleepLogs.add(log)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const RatingSelector = ({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) => (
    <div className="rating-group">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`rating-btn ${value === n ? 'active' : ''}`}
          onClick={() => onChange(n)}
          title={labels[n - 1]}
        >
          {n}
        </button>
      ))}
    </div>
  )

  return (
    <div className="page animate-in">
      <h1 className="page-title">Sleep Diary</h1>
      <p className="text-sm text-muted mb-3">
        {existingLog ? 'Editing today\'s diary entry' : 'CBT-I style check-in for last night and this morning.'}
      </p>

      {/* Times */}
      <div className="card">
        <div className="card-title">Diary Times</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Target bedtime</label>
            <input type="time" value={plannedBedtime} onChange={(e) => setPlannedBedtime(e.target.value)} />
          </div>
          <div className="field">
            <label>Time you got in bed</label>
            <input type="time" value={actualBedtime} onChange={(e) => setActualBedtime(e.target.value)} />
          </div>
          <div className="field">
            <label>Target wake time</label>
            <input type="time" value={plannedWakeTime} onChange={(e) => setPlannedWakeTime(e.target.value)} />
          </div>
          <div className="field">
            <label>Final wake-up time</label>
            <input type="time" value={actualWakeTime} onChange={(e) => setActualWakeTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quality */}
      <div className="card">
        <div className="card-title">Night Quality</div>
        <RatingSelector
          value={sleepQuality}
          onChange={setSleepQuality}
          labels={['Terrible', 'Poor', 'Okay', 'Good', 'Excellent']}
        />
        <div className="text-xs text-muted mt-2">
          {['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][sleepQuality - 1]}
        </div>
      </div>

      {/* Morning feeling */}
      <div className="card">
        <div className="card-title">Morning State</div>
        <RatingSelector
          value={morningFeeling}
          onChange={setMorningFeeling}
          labels={['Exhausted', 'Tired', 'Neutral', 'Refreshed', 'Energized']}
        />
        <div className="text-xs text-muted mt-2">
          {['Exhausted', 'Tired', 'Neutral', 'Refreshed', 'Energized'][morningFeeling - 1]}
        </div>
      </div>

      {/* Micro-awakenings */}
      <div className="card">
        <div className="card-title">Awakenings</div>
        <div className="flex items-center gap-3">
          <button
            className="rating-btn"
            onClick={() => setMicroAwakenings(Math.max(0, microAwakenings - 1))}
          >
            -
          </button>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: 40, textAlign: 'center' }}>
            {microAwakenings}
          </span>
          <button
            className="rating-btn"
            onClick={() => setMicroAwakenings(microAwakenings + 1)}
          >
            +
          </button>
        </div>
        <div className="text-xs text-muted mt-2">
          Number of times you woke up and remember it
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="card-title">Context Notes (optional)</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Examples: stress spike, caffeine late, nap, workout timing..."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <button
        className={`btn btn-full ${saved ? 'btn-success' : 'btn-primary'}`}
        onClick={handleSave}
      >
        {saved ? 'Saved!' : existingLog ? 'Update Log' : 'Save Log'}
      </button>
    </div>
  )
}
