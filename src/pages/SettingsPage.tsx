import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSleepData'
import { updateSettings } from '../db/database'
import { useNotifications } from '../hooks/useNotifications'

export default function SettingsPage() {
  const settings = useSettings()
  const { permission, requestPermission } = useNotifications()

  const [sleepNeed, setSleepNeed] = useState(540)
  const [onsetLatency, setOnsetLatency] = useState(15)
  const [routineDuration, setRoutineDuration] = useState(60)
  const [routineSteps, setRoutineSteps] = useState<string[]>([])
  const [newStep, setNewStep] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setSleepNeed(settings.sleepNeed)
      setOnsetLatency(settings.sleepOnsetLatency)
      setRoutineDuration(settings.routineDuration)
      setRoutineSteps([...settings.routineSteps])
    }
  }, [settings])

  const handleSave = async () => {
    await updateSettings({
      sleepNeed,
      sleepOnsetLatency: onsetLatency,
      routineDuration,
      routineSteps,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addStep = () => {
    if (newStep.trim()) {
      setRoutineSteps([...routineSteps, newStep.trim()])
      setNewStep('')
    }
  }

  const removeStep = (i: number) => {
    setRoutineSteps(routineSteps.filter((_, idx) => idx !== i))
  }

  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= routineSteps.length) return
    const arr = [...routineSteps]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setRoutineSteps(arr)
  }

  if (!settings) return <div className="page"><p>Loading...</p></div>

  return (
    <div className="page animate-in">
      <h1 className="page-title">Settings</h1>

      {/* Sleep need */}
      <div className="card">
        <div className="card-title">Sleep Need</div>
        <div className="field">
          <label>Total in-bed time needed (hours)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={360}
              max={720}
              step={15}
              value={sleepNeed}
              onChange={(e) => setSleepNeed(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 60, textAlign: 'right' }}>
              {(sleepNeed / 60).toFixed(1)}h
            </span>
          </div>
          <div className="text-xs text-muted mt-2">
            Include time for micro-awakenings. You set 9h because you need it to get ~8h of actual sleep.
          </div>
        </div>
      </div>

      {/* Sleep onset latency */}
      <div className="card">
        <div className="card-title">Fall Asleep Time</div>
        <div className="field">
          <label>Minutes to fall asleep</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={onsetLatency}
              onChange={(e) => setOnsetLatency(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 60, textAlign: 'right' }}>
              {onsetLatency}min
            </span>
          </div>
          <div className="text-xs text-muted mt-2">
            This adapts over time as you log actual sleep data.
          </div>
        </div>
      </div>

      {/* Routine duration */}
      <div className="card">
        <div className="card-title">Evening Routine</div>
        <div className="field">
          <label>Routine duration (minutes)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={routineDuration}
              onChange={(e) => setRoutineDuration(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 60, textAlign: 'right' }}>
              {routineDuration}min
            </span>
          </div>
        </div>

        <div className="divider" />

        <div className="card-title">Routine Steps</div>
        {routineSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{step}</span>
            <button
              onClick={() => moveStep(i, -1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, fontSize: '1rem' }}
              disabled={i === 0}
            >
              &uarr;
            </button>
            <button
              onClick={() => moveStep(i, 1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, fontSize: '1rem' }}
              disabled={i === routineSteps.length - 1}
            >
              &darr;
            </button>
            <button
              onClick={() => removeStep(i)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
            >
              &times;
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder="Add step (e.g. Stretch)"
            onKeyDown={(e) => e.key === 'Enter' && addStep()}
          />
          <button className="btn btn-outline" onClick={addStep} style={{ whiteSpace: 'nowrap' }}>
            Add
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-title">Notifications</div>
        {permission === 'granted' ? (
          <div className="text-success text-sm font-bold">Notifications enabled</div>
        ) : permission === 'denied' ? (
          <div className="text-danger text-sm">Notifications blocked. Enable in browser settings.</div>
        ) : permission === 'unsupported' ? (
          <div className="text-muted text-sm">Notifications not supported on this device.</div>
        ) : (
          <button className="btn btn-outline btn-full" onClick={requestPermission}>
            Enable Notifications
          </button>
        )}
      </div>

      <button
        className={`btn btn-full mt-2 ${saved ? 'btn-success' : 'btn-primary'}`}
        onClick={handleSave}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
