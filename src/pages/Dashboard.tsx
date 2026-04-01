import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Zap, Flame, Clock, MapPin } from 'lucide-react'
import { db } from '../db/database'
import { useWeeklyStats, useStreak } from '../hooks/useProgress'
import { useUserStore } from '../store/userStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { formatDuration, formatDistance, activityLabel, activityEmoji } from '../utils/calculations'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const ACTIVITY_TYPES = [
  { type: 'run', label: 'Laufen', emoji: '🏃', color: 'bg-accent/10 border-accent/20 text-accent' },
  { type: 'ride', label: 'Radfahren', emoji: '🚴', color: 'bg-purple/10 border-purple/20 text-purple' },
  { type: 'hike', label: 'Wandern', emoji: '🥾', color: 'bg-success/10 border-success/20 text-success' },
  { type: 'strength', label: 'Kraft', emoji: '🏋️', color: 'bg-warning/10 border-warning/20 text-warning' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const weeklyStats = useWeeklyStats()
  const streak = useStreak()

  const recentWorkouts = useLiveQuery(() =>
    db.workouts.orderBy('startTime').reverse().limit(3).toArray()
  )

  const activeGoals = useLiveQuery(() =>
    db.goals.where('completed').equals(0).limit(3).toArray()
  )

  const unseenFeedback = useLiveQuery(() =>
    db.workouts.filter(w => !w.feedbackSeen).first()
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Guten Morgen'
    if (h < 18) return 'Guten Tag'
    return 'Guten Abend'
  }

  return (
    <div className="px-4 pt-safe pb-4 space-y-5" style={{ paddingTop: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{greeting()},</p>
          <h1 className="text-2xl font-bold text-text-primary">{profile.name} 👋</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl">🔥</div>
          <div className="text-accent font-bold text-sm">{streak ?? 0} Tage</div>
          <div className="text-muted text-xs">Streak</div>
        </div>
      </div>

      {/* Unseen feedback banner */}
      {unseenFeedback && (
        <Card
          glow
          onClick={() => navigate(`/workout/${unseenFeedback.id}/feedback`)}
          className="flex items-center gap-3"
        >
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <p className="text-accent font-medium text-sm">Neues Feedback verfügbar</p>
            <p className="text-text-secondary text-xs">
              {activityLabel(unseenFeedback.type)} vom {format(unseenFeedback.startTime, 'dd. MMM', { locale: de })}
            </p>
          </div>
          <div className="text-accent text-lg">→</div>
        </Card>
      )}

      {/* Weekly Stats */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Diese Woche</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Einheiten"
            value={weeklyStats?.count ?? 0}
            icon={<Zap size={16} />}
            color="accent"
          />
          <StatCard
            label="Kalorien"
            value={weeklyStats?.totalCalories ?? 0}
            unit="kcal"
            icon={<Flame size={16} />}
            color="warning"
          />
          <StatCard
            label="Distanz"
            value={formatDistance(weeklyStats?.totalDistance ?? 0)}
            icon={<MapPin size={16} />}
            color="success"
          />
          <StatCard
            label="Zeit"
            value={formatDuration(weeklyStats?.totalDuration ?? 0)}
            icon={<Clock size={16} />}
            color="purple"
          />
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Training starten</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_TYPES.map(({ type, label, emoji, color }) => (
            <button
              key={type}
              onClick={() => navigate(`/workout/new?type=${type}`)}
              className={`border rounded-card p-4 flex items-center gap-3 active:scale-95 transition-transform ${color}`}
            >
              <span className="text-2xl">{emoji}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
                  <Play size={10} />
                  <span>Starten</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/workout/manual')}
          className="mt-3 w-full border border-dashed border-white/20 rounded-card py-3 text-muted text-sm flex items-center justify-center gap-2 hover:border-accent/40 hover:text-accent transition-colors"
        >
          ✏️ Garmin-Daten manuell eintragen
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals && activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Ziele</h2>
            <button onClick={() => navigate('/goals')} className="text-accent text-xs">Alle →</button>
          </div>
          <div className="space-y-3">
            {activeGoals.map(goal => {
              const pct = Math.min(100, (goal.current / goal.target) * 100)
              return (
                <Card key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{goal.title}</span>
                    <span className="text-xs text-text-secondary">{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={pct} size="md" />
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{goal.current} {goal.unit}</span>
                    <span>Ziel: {goal.target} {goal.unit}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Letzte Trainings</h2>
            <button onClick={() => navigate('/history')} className="text-accent text-xs">Alle →</button>
          </div>
          <div className="space-y-2">
            {recentWorkouts.map(workout => (
              <Card
                key={workout.id}
                onClick={() => navigate(`/workout/${workout.id}`)}
                className="flex items-center gap-3"
              >
                <div className="text-2xl">{activityEmoji(workout.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{activityLabel(workout.type)}</span>
                    {!workout.feedbackSeen && (
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {format(workout.startTime, 'dd. MMM, HH:mm', { locale: de })}
                  </div>
                </div>
                <div className="text-right text-xs text-text-secondary">
                  <div>{formatDuration(workout.duration)}</div>
                  {workout.distance && <div>{formatDistance(workout.distance)}</div>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentWorkouts?.length === 0 && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">🚀</div>
          <p className="text-text-primary font-medium">Starte dein erstes Training!</p>
          <p className="text-text-secondary text-sm mt-1">Wähle eine Aktivität oben und leg los.</p>
        </Card>
      )}
    </div>
  )
}
