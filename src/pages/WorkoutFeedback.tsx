import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, ChevronRight, Brain, Clock, Zap, TrendingUp } from 'lucide-react'
import { db } from '../db/database'
import { useUserStore } from '../store/userStore'
import { generateFeedback } from '../services/feedbackEngine'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { formatDuration, formatDistance, activityLabel, activityEmoji } from '../utils/calculations'
import type { WorkoutFeedback, Workout } from '../types'

const SCORE_LABEL = (s: number) => {
  if (s >= 90) return { label: 'Außergewöhnlich!', color: 'text-accent' }
  if (s >= 75) return { label: 'Ausgezeichnet!', color: 'text-success' }
  if (s >= 60) return { label: 'Gut gemacht!', color: 'text-success' }
  if (s >= 45) return { label: 'Solide Leistung', color: 'text-warning' }
  return { label: 'Guter Start!', color: 'text-muted' }
}

const LOAD_BADGES = {
  low: { label: 'Niedrig', variant: 'muted' as const },
  optimal: { label: 'Optimal', variant: 'success' as const },
  high: { label: 'Hoch', variant: 'warning' as const },
  overreaching: { label: 'Überbelastung', variant: 'danger' as const },
}

export function WorkoutFeedback() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [feedback, setFeedback] = useState<WorkoutFeedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreAnim, setScoreAnim] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const w = await db.workouts.get(parseInt(id))
      if (!w) { navigate('/'); return }
      setWorkout(w)

      const fb = await generateFeedback(w, profile)
      setFeedback(fb)

      // Mark as seen
      await db.workouts.update(parseInt(id), { feedbackSeen: true })
      setLoading(false)

      // Animate score
      let current = 0
      const target = fb.performanceScore
      const step = setInterval(() => {
        current = Math.min(current + 2, target)
        setScoreAnim(current)
        if (current >= target) clearInterval(step)
      }, 20)
    }
    load()
  }, [id, profile, navigate])

  if (loading || !workout || !feedback) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">📊</div>
          <p className="text-text-secondary">Feedback wird analysiert...</p>
        </div>
      </div>
    )
  }

  const scoreInfo = SCORE_LABEL(feedback.performanceScore)
  const loadBadge = LOAD_BADGES[feedback.trainingLoadStatus]

  return (
    <div className="min-h-screen bg-bg px-4 pt-6 pb-8 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-4xl">{activityEmoji(workout.type)}</div>
        <h1 className="text-xl font-bold text-text-primary">Training abgeschlossen!</h1>
        <p className="text-text-secondary text-sm">{activityLabel(workout.type)}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-card p-3 text-center border border-white/5">
          <div className="text-lg font-bold text-text-primary">{formatDuration(workout.duration)}</div>
          <div className="text-xs text-muted">Dauer</div>
        </div>
        <div className="bg-surface rounded-card p-3 text-center border border-white/5">
          <div className="text-lg font-bold text-accent">{workout.distance ? formatDistance(workout.distance) : `${workout.sets?.length ?? 0} Sätze`}</div>
          <div className="text-xs text-muted">{workout.distance ? 'Distanz' : 'Sätze'}</div>
        </div>
        <div className="bg-surface rounded-card p-3 text-center border border-white/5">
          <div className="text-lg font-bold text-warning">{workout.calories ?? 0}</div>
          <div className="text-xs text-muted">kcal</div>
        </div>
      </div>

      {/* Performance Score */}
      <Card glow className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            Performance Score
          </span>
          <Badge variant={loadBadge.variant} size="md">
            Trainingsbelastung: {loadBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a24" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="3"
                strokeDasharray={`${scoreAnim} 100`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.6))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">{scoreAnim}</span>
            </div>
          </div>
          <div>
            <div className={`text-xl font-bold ${scoreInfo.color}`}>{scoreInfo.label}</div>
            <p className="text-text-secondary text-sm mt-1">
              Im Vergleich zu deinen letzten 4 Wochen
            </p>
          </div>
        </div>
        <ProgressBar value={scoreAnim} size="md" animated={loading} />
      </Card>

      {/* Insights */}
      {feedback.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} /> Analyse
          </h2>
          {feedback.insights.map((insight, i) => (
            <Card key={i} className={`flex items-start gap-3 border-l-2 ${
              insight.type === 'positive' ? 'border-l-success' :
              insight.type === 'warning' ? 'border-l-warning' : 'border-l-accent'
            }`}>
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <div className="font-medium text-sm text-text-primary">{insight.title}</div>
                <div className="text-xs text-text-secondary mt-0.5">{insight.detail}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recovery */}
      <Card className="flex items-start gap-3">
        <Clock size={20} className="text-purple mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium text-sm text-text-primary mb-1">
            Erholung: {feedback.recoveryHours}h empfohlen
          </div>
          <p className="text-text-secondary text-xs">{feedback.recoveryAdvice}</p>
        </div>
      </Card>

      {/* Science Tip */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">Wissenschafts-Tipp des Tages</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{feedback.scienceTip}</p>
      </Card>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate(`/workout/${id}`)}
          variant="secondary"
        >
          <div className="flex items-center justify-center gap-2">
            Details anzeigen <ChevronRight size={16} />
          </div>
        </Button>
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/')}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Zum Dashboard
          </div>
        </Button>
      </div>
    </div>
  )
}
