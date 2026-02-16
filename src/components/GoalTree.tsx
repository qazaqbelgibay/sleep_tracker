import { useState } from 'react'
import { db } from '../db/database'

interface TreeNode {
  label: string
  children?: TreeNode[]
  goal?: {
    goalLabel: string
    targetMetric: string
    targetValue: string
    targetDirection: 'before' | 'after' | 'within'
    streakRequired: number
  }
}

const GOAL_TREE: TreeNode[] = [
  {
    label: 'Fix my sleep schedule',
    children: [
      {
        label: 'I fall asleep too late',
        children: [
          {
            label: 'Be in bed by midnight',
            goal: { goalLabel: 'Be in bed by midnight for 7 days', targetMetric: 'actualBedtime', targetValue: '00:00', targetDirection: 'before', streakRequired: 7 },
          },
          {
            label: 'Be in bed by 11 PM',
            goal: { goalLabel: 'Be in bed by 11 PM for 7 days', targetMetric: 'actualBedtime', targetValue: '23:00', targetDirection: 'before', streakRequired: 7 },
          },
          {
            label: 'Be in bed by 10 PM',
            goal: { goalLabel: 'Be in bed by 10 PM for 7 days', targetMetric: 'actualBedtime', targetValue: '22:00', targetDirection: 'before', streakRequired: 7 },
          },
        ],
      },
      {
        label: 'My schedule is inconsistent',
        children: [
          {
            label: 'Same bedtime every night',
            goal: { goalLabel: 'Consistent bedtime (within 30 min) for 7 days', targetMetric: 'consistency', targetValue: '30', targetDirection: 'within', streakRequired: 7 },
          },
          {
            label: 'Same wake time every day',
            goal: { goalLabel: 'Consistent wake time (within 30 min) for 7 days', targetMetric: 'wakeConsistency', targetValue: '30', targetDirection: 'within', streakRequired: 7 },
          },
        ],
      },
      {
        label: 'I wake up too early',
        goal: { goalLabel: 'Sleep full duration for 7 days', targetMetric: 'sleepDuration', targetValue: '480', targetDirection: 'after', streakRequired: 7 },
      },
    ],
  },
  {
    label: 'Improve sleep quality',
    children: [
      {
        label: 'Rate 4+ quality for a week',
        goal: { goalLabel: 'Sleep quality 4+ for 7 consecutive days', targetMetric: 'sleepQuality', targetValue: '4', targetDirection: 'after', streakRequired: 7 },
      },
      {
        label: 'Reduce micro-awakenings',
        goal: { goalLabel: 'Max 2 micro-awakenings for 7 days', targetMetric: 'microAwakenings', targetValue: '2', targetDirection: 'before', streakRequired: 7 },
      },
      {
        label: 'Feel great in the morning',
        goal: { goalLabel: 'Morning feeling 4+ for 7 consecutive days', targetMetric: 'morningFeeling', targetValue: '4', targetDirection: 'after', streakRequired: 7 },
      },
    ],
  },
  {
    label: 'Build evening routine habit',
    children: [
      {
        label: 'Complete routine 5 days in a row',
        goal: { goalLabel: 'Complete evening routine for 5 consecutive days', targetMetric: 'routineCompleted', targetValue: '1', targetDirection: 'after', streakRequired: 5 },
      },
      {
        label: 'Start routine on time for a week',
        goal: { goalLabel: 'Start routine on time for 7 consecutive days', targetMetric: 'routineOnTime', targetValue: '1', targetDirection: 'after', streakRequired: 7 },
      },
    ],
  },
  {
    label: 'Reduce phone scrolling before bed',
    children: [
      {
        label: 'No screens 30 min before bed',
        goal: { goalLabel: 'No screens 30 min before bed for 7 days', targetMetric: 'screenFree', targetValue: '30', targetDirection: 'after', streakRequired: 7 },
      },
      {
        label: 'No screens 1 hour before bed',
        goal: { goalLabel: 'No screens 1 hour before bed for 7 days', targetMetric: 'screenFree', targetValue: '60', targetDirection: 'after', streakRequired: 7 },
      },
    ],
  },
]

interface Props {
  onGoalSelected: () => void
}

export default function GoalTree({ onGoalSelected }: Props) {
  const [path, setPath] = useState<number[]>([])

  const getCurrentNodes = (): TreeNode[] => {
    let nodes: TreeNode[] = GOAL_TREE
    for (const idx of path) {
      const node = nodes[idx]
      if (node.children) {
        nodes = node.children
      }
    }
    return nodes
  }

  const currentNodes = getCurrentNodes()

  const selectNode = async (idx: number) => {
    const node = currentNodes[idx]
    if (node.goal) {
      // Leaf node — create the goal
      await db.activeGoals.add({
        goalPath: [...path.map(String), String(idx)],
        goalLabel: node.goal.goalLabel,
        targetMetric: node.goal.targetMetric,
        targetValue: node.goal.targetValue,
        targetDirection: node.goal.targetDirection,
        streakRequired: node.goal.streakRequired,
        currentStreak: 0,
        startDate: new Date().toISOString().slice(0, 10),
        achieved: false,
      })
      setPath([])
      onGoalSelected()
    } else if (node.children) {
      setPath([...path, idx])
    }
  }

  return (
    <div className="animate-in">
      {path.length > 0 && (
        <button
          className="btn btn-outline mb-3"
          onClick={() => setPath(path.slice(0, -1))}
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          Back
        </button>
      )}

      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        {path.length === 0 ? 'What do you want to work on?' : 'Narrow it down:'}
      </div>

      <div className="flex-col gap-2">
        {currentNodes.map((node, i) => (
          <button
            key={i}
            onClick={() => selectNode(i)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '14px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {node.label}
            {node.children && (
              <span style={{ float: 'right', color: 'var(--text-muted)' }}>&rsaquo;</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
