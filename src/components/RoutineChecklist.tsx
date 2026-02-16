import { useState } from 'react'
import type { RoutineStep } from '../lib/sleepAlgorithm'
import { formatTime12 } from '../lib/sleepAlgorithm'

interface Props {
  steps: RoutineStep[]
}

export default function RoutineChecklist({ steps }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  if (steps.length === 0) return null

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const allDone = checked.size === steps.length

  return (
    <div className="card">
      <div className="card-title">Evening Routine</div>
      {steps.map((step, i) => (
        <div
          key={i}
          onClick={() => toggle(i)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
            opacity: checked.has(i) ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: `2px solid ${checked.has(i) ? 'var(--success)' : 'var(--border)'}`,
            background: checked.has(i) ? 'var(--success)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {checked.has(i) && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 600,
              textDecoration: checked.has(i) ? 'line-through' : 'none',
              color: checked.has(i) ? 'var(--text-muted)' : 'var(--text-primary)',
            }}>
              {step.label}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {formatTime12(step.startTime)}
          </div>
        </div>
      ))}
      {allDone && (
        <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--success)', fontWeight: 600 }}>
          All done! Time for bed.
        </div>
      )}
    </div>
  )
}
