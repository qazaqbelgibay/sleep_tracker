import { useCountdown } from '../hooks/useCountdown'
import { formatTime12 } from '../lib/sleepAlgorithm'

interface Props {
  bedtime: Date | null
  routineStart: Date | null
}

export default function CountdownTimer({ bedtime, routineStart }: Props) {
  const bedCountdown = useCountdown(bedtime)
  const routineCountdown = useCountdown(routineStart)

  // Determine current phase
  const isRoutineTime = routineStart && routineCountdown.isPast && bedtime && !bedCountdown.isPast
  const isBedtime = bedtime && bedCountdown.isPast
  const countdown = isRoutineTime ? bedCountdown : routineCountdown

  let phase: string
  let phaseColor: string
  if (isBedtime) {
    phase = 'Time for bed!'
    phaseColor = 'var(--danger)'
  } else if (isRoutineTime) {
    phase = 'Evening routine — bedtime in'
    phaseColor = 'var(--warning)'
  } else {
    phase = 'Time until routine starts'
    phaseColor = 'var(--accent)'
  }

  return (
    <div style={{
      textAlign: 'center',
      padding: '32px 16px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      marginBottom: 16,
      animation: isBedtime ? 'pulse-glow 2s ease-in-out infinite' : undefined,
    }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {phase}
      </div>

      {isBedtime ? (
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: phaseColor, fontVariantNumeric: 'tabular-nums' }}>
          GO TO SLEEP
        </div>
      ) : (
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: phaseColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
          {countdown.label}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20 }}>
        {routineStart && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Routine</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isRoutineTime ? 'var(--warning)' : 'var(--text-secondary)' }}>
              {formatTime12(routineStart)}
            </div>
          </div>
        )}
        {bedtime && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Bedtime</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isBedtime ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {formatTime12(bedtime)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
