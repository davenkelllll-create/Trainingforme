import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { TrendingUp } from 'lucide-react'
import { db } from '../db/database'
import { useWeeklyVolume, useTrainingLoad } from '../hooks/useProgress'
import { useUserStore } from '../store/userStore'
import { Card } from '../components/ui/Card'
import { estimateVO2max } from '../utils/calculations'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

type Tab = 'overview' | 'cardio' | 'strength' | 'body'

export function Progress() {
  const [tab, setTab] = useState<Tab>('overview')
  const { profile } = useUserStore()
  const weeklyVolume = useWeeklyVolume(8)
  const trainingLoad = useTrainingLoad()

  const runBests = useLiveQuery(async () => {
    const runs = await db.workouts.where('type').equals('run').toArray()
    if (runs.length === 0) return null
    const bestPace = runs.filter(w => w.avgPace).sort((a, b) => (a.avgPace ?? 999) - (b.avgPace ?? 999))[0]
    const longestRun = runs.sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))[0]
    return { bestPace, longestRun, count: runs.length }
  })

  const strengthBests = useLiveQuery(async () => {
    const sets = (await db.workouts.where('type').equals('strength').toArray())
      .flatMap(w => w.sets ?? [])
    const byExercise: Record<string, number> = {}
    for (const s of sets) {
      if (!byExercise[s.exercise] || s.weight > byExercise[s.exercise]) {
        byExercise[s.exercise] = s.weight
      }
    }
    return byExercise
  })

  const vo2max = estimateVO2max(profile.maxHr, profile.restingHr)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Übersicht' },
    { key: 'cardio', label: '🏃 Cardio' },
    { key: 'strength', label: '🏋️ Kraft' },
    { key: 'body', label: '⚖️ Körper' },
  ]

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <TrendingUp size={24} className="text-purple" />
        Fortschritt
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-card p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-accent text-bg' : 'text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Training Load */}
          {trainingLoad && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Trainingsbelastung (CTL/ATL)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">{trainingLoad.ctl}</div>
                  <div className="text-xs text-muted">Fitness (CTL)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{trainingLoad.atl}</div>
                  <div className="text-xs text-muted">Fatigue (ATL)</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${trainingLoad.tsb >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {trainingLoad.tsb > 0 ? '+' : ''}{trainingLoad.tsb}
                  </div>
                  <div className="text-xs text-muted">Form (TSB)</div>
                </div>
              </div>
              <p className="text-xs text-muted mt-3">
                TSB {trainingLoad.tsb > 5 ? '> +5: Gut erholt, bereit für intensive Einheit' :
                     trainingLoad.tsb < -10 ? '< -10: Überlastet – Erholung priorisieren' :
                     'im optimalen Bereich für Training'}
              </p>
            </Card>
          )}

          {/* Weekly Volume Chart */}
          {weeklyVolume && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Wöchentliches Volumen (km)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyVolume} barSize={10}>
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="run" stackId="a" fill="#00d4ff" radius={[0,0,0,0]} name="Laufen" />
                  <Bar dataKey="ride" stackId="a" fill="#7c3aed" name="Radfahren" />
                  <Bar dataKey="hike" stackId="a" fill="#10b981" name="Wandern" />
                  <Bar dataKey="strength" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} name="Kraft" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Cardio Tab */}
      {tab === 'cardio' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <div className="text-2xl font-bold text-accent">{Math.round(vo2max)}</div>
              <div className="text-xs text-muted mt-1">Gesch. VO2max</div>
              <div className="text-xs text-text-secondary mt-0.5">
                {vo2max > 55 ? 'Exzellent' : vo2max > 45 ? 'Sehr gut' : vo2max > 35 ? 'Gut' : 'Ausbaufähig'}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-purple">{runBests?.count ?? 0}</div>
              <div className="text-xs text-muted mt-1">Läufe gesamt</div>
            </Card>
          </div>

          {runBests?.bestPace && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-2">🏆 Persönliche Bestleistungen</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Schnellstes Tempo</span>
                <span className="text-accent font-bold">
                  {Math.floor((runBests.bestPace.avgPace ?? 0) / 60)}:{String(Math.round((runBests.bestPace.avgPace ?? 0) % 60)).padStart(2, '0')} /km
                </span>
              </div>
              {runBests?.longestRun && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-text-secondary">Längster Lauf</span>
                  <span className="text-accent font-bold">{((runBests.longestRun.distance ?? 0) / 1000).toFixed(1)} km</span>
                </div>
              )}
            </Card>
          )}

          {weeklyVolume && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Lauf-Volumen (km/Woche)</h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={weeklyVolume}>
                  <defs>
                    <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="run" stroke="#00d4ff" fill="url(#runGrad)" strokeWidth={2} dot={false} name="km" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Strength Tab */}
      {tab === 'strength' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">🏆 Maximale Gewichte (kg)</h3>
            {strengthBests && Object.keys(strengthBests).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(strengthBests)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([exercise, weight]) => (
                    <div key={exercise}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-secondary">{exercise}</span>
                        <span className="text-accent font-bold text-sm">{weight} kg</span>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple rounded-full"
                          style={{ width: `${Math.min(100, (weight / 150) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Noch keine Kraftdaten vorhanden.</p>
            )}
          </Card>
        </div>
      )}

      {/* Body Tab */}
      {tab === 'body' && (
        <div className="space-y-4">
          <Card className="text-center space-y-3">
            <div className="text-4xl">⚖️</div>
            <p className="text-text-secondary text-sm">
              Körpergewicht-Tracking kommt in einem zukünftigen Update.
            </p>
            <p className="text-muted text-xs">
              Aktuell: {profile.weight} kg | Ziel aus Profil-Einstellungen
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Profil-Metriken</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Gewicht</span><span className="text-text-primary">{profile.weight} kg</span></div>
              <div className="flex justify-between"><span className="text-muted">Größe</span><span className="text-text-primary">{profile.height} cm</span></div>
              <div className="flex justify-between"><span className="text-muted">BMI</span><span className="text-text-primary">{(profile.weight / ((profile.height / 100) ** 2)).toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Ruhe-HF</span><span className="text-text-primary">{profile.restingHr} bpm</span></div>
              <div className="flex justify-between"><span className="text-muted">Max-HF</span><span className="text-text-primary">{profile.maxHr} bpm</span></div>
              <div className="flex justify-between"><span className="text-muted">VO2max (gesch.)</span><span className="text-accent font-bold">{Math.round(vo2max)}</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
