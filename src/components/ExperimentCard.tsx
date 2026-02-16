import type { Experiment } from '../db/database'

interface Props {
  experiment: Experiment
  daysRemaining: number
}

export default function ExperimentCard({ experiment, daysRemaining }: Props) {
  const statusColors = {
    baseline: 'var(--text-muted)',
    testing: 'var(--accent)',
    completed: 'var(--success)',
  }

  const statusLabels = {
    baseline: 'Baseline Period',
    testing: 'Testing Variable',
    completed: 'Completed',
  }

  return (
    <div className="card" style={{ borderLeft: `3px solid ${statusColors[experiment.status]}` }}>
      <div className="flex justify-between items-center mb-2">
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
          {experiment.variable}
        </div>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 12,
          background: experiment.status === 'completed' ? 'var(--success)' : 'var(--bg-input)',
          color: experiment.status === 'completed' ? '#0f172a' : statusColors[experiment.status],
        }}>
          {statusLabels[experiment.status]}
        </span>
      </div>

      {experiment.status !== 'completed' && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in {experiment.status} phase
        </div>
      )}

      {experiment.conclusion && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: experiment.conclusion === 'helped' ? 'rgba(52, 211, 153, 0.1)' :
                      experiment.conclusion === 'hurt' ? 'rgba(248, 113, 113, 0.1)' :
                      'rgba(148, 163, 184, 0.1)',
          color: experiment.conclusion === 'helped' ? 'var(--success)' :
                 experiment.conclusion === 'hurt' ? 'var(--danger)' :
                 'var(--text-muted)',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          {experiment.conclusion === 'helped' && 'This variable helped your sleep!'}
          {experiment.conclusion === 'no_effect' && 'No significant effect detected.'}
          {experiment.conclusion === 'hurt' && 'This variable hurt your sleep.'}
        </div>
      )}
    </div>
  )
}
