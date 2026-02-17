import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ScheduleEntry } from '../db/database'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [showForm, setShowForm] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventTime, setEventTime] = useState('08:30')
  const [prepTime, setPrepTime] = useState(60)

  const entries = useLiveQuery(
    () => db.scheduleEntries.where('dayOfWeek').equals(selectedDay).sortBy('eventTime'),
    [selectedDay],
    [],
  )

  const handleAdd = async () => {
    if (!eventName.trim()) return
    await db.scheduleEntries.add({
      dayOfWeek: selectedDay,
      eventName: eventName.trim(),
      eventTime,
      prepTime,
    })
    setEventName('')
    setEventTime('08:30')
    setPrepTime(60)
    setShowForm(false)
  }

  const handleDelete = async (entry: ScheduleEntry) => {
    if (entry.id) await db.scheduleEntries.delete(entry.id)
  }

  return (
    <div className="page animate-in">
      <h1 className="page-title">Schedule</h1>
      <p className="text-sm text-muted mb-3">
        Add commitments and prep time. Tonight's bedtime is calculated from tomorrow's earliest requirement.
      </p>

      {/* Day selector */}
      <div className="day-selector mb-3">
        {DAYS.map((d, i) => (
          <button
            key={d}
            className={`day-btn ${i === selectedDay ? 'active' : ''}`}
            onClick={() => setSelectedDay(i)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Entries for selected day */}
      {entries.length === 0 && !showForm && (
        <div className="empty-state">
          <p>No events on {DAYS[selectedDay]}.</p>
          <p className="text-xs">Add your first commitment below.</p>
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="card flex justify-between items-center">
          <div>
            <div style={{ fontWeight: 600 }}>{entry.eventName}</div>
            <div className="text-sm text-muted">
              at {entry.eventTime} &middot; {entry.prepTime}min prep
            </div>
          </div>
          <button
            onClick={() => handleDelete(entry)}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div className="card animate-in">
          <div className="card-title">New Event</div>

          <div className="field">
            <label>Event name</label>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Class, Work, Gym"
            />
          </div>

          <div className="field">
            <label>Event time</label>
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          </div>

          <div className="field">
            <label>Prep time before event (minutes)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              min={0}
              max={180}
            />
            <div className="text-xs text-muted mt-2">
              Time to get ready, commute, eat breakfast, etc.
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Add Event</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary btn-full mt-2" onClick={() => setShowForm(true)}>
          + Add Event
        </button>
      )}

      {/* Quick-add presets */}
      {!showForm && entries.length === 0 && (
        <div className="mt-4">
          <div className="card-title">Quick Add</div>
          <div className="chip-group">
            {[
              { name: 'Morning Class', time: '08:30', prep: 60 },
              { name: 'Work', time: '09:00', prep: 60 },
              { name: 'Gym', time: '07:00', prep: 30 },
              { name: 'Afternoon Class', time: '14:00', prep: 45 },
            ].map((preset) => (
              <button
                key={preset.name}
                className="chip"
                onClick={async () => {
                  await db.scheduleEntries.add({
                    dayOfWeek: selectedDay,
                    eventName: preset.name,
                    eventTime: preset.time,
                    prepTime: preset.prep,
                  })
                }}
              >
                {preset.name} ({preset.time})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
