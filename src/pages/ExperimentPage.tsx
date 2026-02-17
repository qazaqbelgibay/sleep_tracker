import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Experiment } from '../db/database'
import ExperimentCard from '../components/ExperimentCard'
import { analyzeExperiment } from '../lib/experimentAnalysis'

const VARIABLES = [
  'Melatonin',
  'No caffeine after 2 PM',
  'No caffeine after 12 PM',
  'No screens 1h before bed',
  'No screens 30min before bed',
  'Cold room (< 19°C / 66°F)',
  'Warm shower before bed',
  'Exercise in morning',
  'Exercise in evening',
  'No alcohol',
  'Reading before bed',
  'Meditation before bed',
  'White noise / fan',
  'Blackout curtains',
  'Weighted blanket',
  'Magnesium supplement',
]

export default function ExperimentPage() {
  const [showNew, setShowNew] = useState(false)
  const [selectedVar, setSelectedVar] = useState('')

  const experiments = useLiveQuery(() => db.experiments.toArray(), [], [])
  const activeExperiment = experiments.find((e) => e.status !== 'completed')

  const startExperiment = async () => {
    if (!selectedVar || activeExperiment) return

    await db.experiments.add({
      variable: selectedVar,
      status: 'baseline',
      baselineStartDate: new Date().toISOString().slice(0, 10),
      baselineDays: 7,
      testingDays: 7,
    })
    setSelectedVar('')
    setShowNew(false)
  }

  const advanceExperiment = async (exp: Experiment) => {
    if (!exp.id) return

    if (exp.status === 'baseline') {
      await db.experiments.update(exp.id, {
        status: 'testing',
        testingStartDate: new Date().toISOString().slice(0, 10),
      })
    } else if (exp.status === 'testing') {
      // Analyze and complete
      const expLogs = await db.experimentLogs.where('experimentId').equals(exp.id).toArray()
      const sleepLogs = await db.sleepLogs.toArray()

      const baselineLogs = expLogs.filter((l) => !l.applied)
      const testingLogs = expLogs.filter((l) => l.applied)

      const result = analyzeExperiment(baselineLogs, testingLogs, sleepLogs)

      await db.experiments.update(exp.id, {
        status: 'completed',
        endDate: new Date().toISOString().slice(0, 10),
        conclusion: result?.verdict ?? 'no_effect',
      })
    }
  }

  const logExperimentDay = async (exp: Experiment, applied: boolean, value: string) => {
    if (!exp.id) return
    const today = new Date().toISOString().slice(0, 10)
    const todaySleep = await db.sleepLogs.where('date').equals(today).first()

    const existing = await db.experimentLogs
      .where('[experimentId+date]')
      .equals([exp.id, today])
      .first()

    if (existing?.id) {
      await db.experimentLogs.update(existing.id, {
        applied,
        value: value || undefined,
        sleepLogId: todaySleep?.id,
      })
      return
    }

    await db.experimentLogs.add({
      experimentId: exp.id,
      date: today,
      applied,
      value: value || undefined,
      sleepLogId: todaySleep?.id,
    })
  }

  const adherence = useLiveQuery(async () => {
    if (!activeExperiment?.id) return null
    const logs = await db.experimentLogs.where('experimentId').equals(activeExperiment.id).toArray()
    if (logs.length === 0) return 0
    const appliedDays = logs.filter((l) => l.applied).length
    return Math.round((appliedDays / logs.length) * 100)
  }, [activeExperiment?.id], null)

  const getDaysRemaining = (exp: Experiment): number => {
    const start = exp.status === 'testing' ? exp.testingStartDate : exp.baselineStartDate
    if (!start) return 0
    const days = exp.status === 'testing' ? exp.testingDays : exp.baselineDays
    const startDate = new Date(start)
    const now = new Date()
    const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days - elapsed)
  }

  return (
    <div className="page animate-in">
      <h1 className="page-title">Experiments</h1>
      <p className="text-sm text-muted mb-3">
        CBT-I style variable experiments: keep the plan stable and test one lever at a time.
      </p>

      {/* Active experiment */}
      {activeExperiment && (
        <div className="mb-3">
          <ExperimentCard experiment={activeExperiment} daysRemaining={getDaysRemaining(activeExperiment)} />

          <div className="card">
            <div className="card-title">
              {activeExperiment.status === 'baseline'
                ? 'Baseline: Log normally (no variable)'
                : `Testing: Apply "${activeExperiment.variable}" tonight`}
            </div>

            {adherence !== null && (
              <div className="mb-2">
                <span className="stat-chip">Adherence {adherence}%</span>
              </div>
            )}

            {activeExperiment.status === 'baseline' && (
              <p className="text-sm text-muted mb-3">
                Sleep as you normally would. This establishes your baseline.
              </p>
            )}

            {activeExperiment.status === 'testing' && (
              <div className="field">
                <label>Details (optional)</label>
                <input
                  id="exp-value"
                  placeholder={`e.g. "took 3mg at 9:15 PM"`}
                />
              </div>
            )}

            <div className="flex gap-2">
              {activeExperiment.status === 'baseline' && (
                <button
                  className="btn btn-outline btn-full"
                  onClick={() => logExperimentDay(activeExperiment, false, '')}
                >
                  Log baseline day
                </button>
              )}
              {activeExperiment.status === 'testing' && (
                <>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => {
                      const val = (document.getElementById('exp-value') as HTMLInputElement)?.value || ''
                      logExperimentDay(activeExperiment, true, val)
                    }}
                  >
                    Applied it
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => logExperimentDay(activeExperiment, false, '')}
                  >
                    Skipped
                  </button>
                </>
              )}
            </div>

            {getDaysRemaining(activeExperiment) === 0 && (
              <button
                className="btn btn-success btn-full mt-3"
                onClick={() => advanceExperiment(activeExperiment)}
              >
                {activeExperiment.status === 'baseline' ? 'Start testing phase' : 'Finish & see results'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Past experiments */}
      {experiments.filter((e) => e.status === 'completed').length > 0 && (
        <div className="mb-3">
          <div className="card-title">Past Experiments</div>
          {experiments
            .filter((e) => e.status === 'completed')
            .map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} daysRemaining={0} />
            ))}
        </div>
      )}

      {/* New experiment */}
      {!activeExperiment && (
        <>
          {showNew ? (
            <div className="card animate-in">
              <div className="card-title">Choose a variable to test</div>
              <div className="chip-group">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    className={`chip ${selectedVar === v ? 'active' : ''}`}
                    onClick={() => setSelectedVar(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {selectedVar && (
                <div className="mt-3">
                  <p className="text-sm mb-2">
                    You'll track <strong>{selectedVar}</strong> for 14 days: 7 days baseline + 7 days testing.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-full" onClick={startExperiment}>
                      Start Experiment
                    </button>
                    <button className="btn btn-outline" onClick={() => { setShowNew(false); setSelectedVar('') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary btn-full" onClick={() => setShowNew(true)}>
              + New Experiment
            </button>
          )}
        </>
      )}
    </div>
  )
}
