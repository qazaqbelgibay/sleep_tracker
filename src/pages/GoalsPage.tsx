import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import GoalTree from '../components/GoalTree'
import { useState } from 'react'

export default function GoalsPage() {
  const [showTree, setShowTree] = useState(false)

  const activeGoal = useLiveQuery(
    () => db.activeGoals.where('achieved').equals(0).first(),
    [],
  )

  const completedGoals = useLiveQuery(
    () => db.activeGoals.where('achieved').equals(1).toArray(),
    [],
    [],
  )

  const handleAbandon = async () => {
    if (activeGoal?.id) {
      await db.activeGoals.delete(activeGoal.id)
    }
  }

  return (
    <div className="page animate-in">
      <h1 className="page-title">Goals</h1>

      {activeGoal && !showTree ? (
        <div>
          <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="card-title">Current Goal</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
              {activeGoal.goalLabel}
            </div>

            {/* Progress bar */}
            <div style={{
              height: 8,
              background: 'var(--bg-input)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (activeGoal.currentStreak / activeGoal.streakRequired) * 100)}%`,
                background: 'var(--accent)',
                borderRadius: 4,
                transition: 'width 0.5s',
              }} />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted">Progress</span>
              <span className="font-bold text-accent">
                {activeGoal.currentStreak} / {activeGoal.streakRequired} days
              </span>
            </div>

            <div className="text-xs text-muted mt-2">
              Started {activeGoal.startDate}
            </div>

            <button
              className="btn btn-outline btn-full mt-3"
              onClick={handleAbandon}
              style={{ fontSize: '0.85rem' }}
            >
              Abandon goal
            </button>
          </div>
        </div>
      ) : !showTree ? (
        <div>
          <div className="empty-state">
            <p>No active goal.</p>
            <p>Pick one to stay accountable!</p>
          </div>
          <button
            className="btn btn-primary btn-full mt-2"
            onClick={() => setShowTree(true)}
          >
            Choose a Goal
          </button>
        </div>
      ) : (
        <GoalTree onGoalSelected={() => setShowTree(false)} />
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="mt-4">
          <div className="card-title">Achieved Goals</div>
          {completedGoals.map((g) => (
            <div key={g.id} className="card" style={{ borderLeft: '3px solid var(--success)', opacity: 0.8 }}>
              <div className="flex justify-between items-center">
                <div style={{ fontWeight: 600 }}>{g.goalLabel}</div>
                <span className="text-success text-sm font-bold">Done</span>
              </div>
              <div className="text-xs text-muted mt-2">
                {g.startDate}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
