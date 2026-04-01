import { db } from '../db/database'
import { calculateTRIMP, estimateVO2max } from '../utils/calculations'
import { getDailyTip, getRecoveryMessage } from '../utils/scienceRules'
import type { Workout, WorkoutFeedback, FeedbackInsight, UserProfile } from '../types'

export async function generateFeedback(workout: Workout, profile: UserProfile): Promise<WorkoutFeedback> {
  if (!workout.id) throw new Error('Workout must have an id')

  // Get last 28 days of workouts for comparison
  const since = Date.now() - 28 * 86400000
  const recentWorkouts = await db.workouts
    .where('startTime')
    .above(since)
    .and(w => w.id !== workout.id)
    .toArray()

  const sameType = recentWorkouts.filter(w => w.type === workout.type)

  // Calculate TRIMP if not already present
  const trimp = workout.trimp ?? (
    workout.avgHeartRate
      ? calculateTRIMP(workout.duration, workout.avgHeartRate, profile.restingHr, profile.maxHr)
      : Math.round(workout.duration / 60 * 2)
  )

  // Performance score
  const score = calculatePerformanceScore(workout, sameType)

  // Insights
  const insights: FeedbackInsight[] = []

  // Distance comparison
  if (workout.distance && sameType.length >= 2) {
    const avgDist = sameType.reduce((a, w) => a + (w.distance ?? 0), 0) / sameType.length
    const pct = ((workout.distance - avgDist) / avgDist) * 100
    if (pct > 10) {
      insights.push({
        type: 'positive',
        icon: '📏',
        title: `+${Math.round(pct)}% Distanz`,
        detail: `Deine beste Distanz der letzten 4 Wochen für ${activityLabel(workout.type)}!`,
      })
    } else if (pct < -20) {
      insights.push({
        type: 'info',
        icon: '📏',
        title: 'Kürzere Einheit',
        detail: 'Kurze Einheiten sind super für aktive Erholung. Variation im Training ist wissenschaftlich sinnvoll.',
      })
    }
  }

  // Pace comparison for runs
  if (workout.type === 'run' && workout.avgPace && sameType.length >= 2) {
    const paces = sameType.filter(w => w.avgPace && w.avgPace > 0).map(w => w.avgPace!)
    if (paces.length > 0) {
      const avgPace = paces.reduce((a, b) => a + b, 0) / paces.length
      const improvement = ((avgPace - workout.avgPace) / avgPace) * 100
      if (improvement > 3) {
        insights.push({
          type: 'positive',
          icon: '⚡',
          title: `${Math.round(improvement)}% schneller`,
          detail: 'Dein Tempo war deutlich besser als dein 4-Wochen-Durchschnitt. Top!',
        })
      }
    }
  }

  // HR zone analysis
  if (workout.hrZones) {
    const intenseTime = (workout.hrZones.z4 ?? 0) + (workout.hrZones.z5 ?? 0)
    if (intenseTime > 40) {
      insights.push({
        type: 'warning',
        icon: '❤️',
        title: 'Hohe Herzfrequenz-Belastung',
        detail: `${intenseTime}% der Zeit in Zone 4-5. Nach der 80/20-Regel sollten max. 20% der wöchentlichen Sessions intensiv sein.`,
      })
    } else if ((workout.hrZones.z2 ?? 0) > 50) {
      insights.push({
        type: 'positive',
        icon: '💚',
        title: 'Perfekte aerobe Basis',
        detail: 'Mehr als 50% in Zone 2 – genau richtig für Ausdaueraufbau nach dem 80/20-Prinzip.',
      })
    }
  }

  // Streak / consistency
  const last7Days = recentWorkouts.filter(w => w.startTime > Date.now() - 7 * 86400000)
  if (last7Days.length >= 4) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      title: `${last7Days.length + 1}x diese Woche`,
      detail: 'Hohe Trainingsfrequenz! Achte auf ausreichend Erholung zwischen intensiven Einheiten.',
    })
  }

  // VO2max estimate for runs with HR
  if (workout.type === 'run' && profile.maxHr && profile.restingHr) {
    const vo2 = Math.round(estimateVO2max(profile.maxHr, profile.restingHr))
    insights.push({
      type: 'info',
      icon: '🫀',
      title: `Geschätzter VO2max: ${vo2} ml/kg/min`,
      detail: vo2 > 50 ? 'Exzellente aerobe Kapazität!' : vo2 > 40 ? 'Gute aerobe Basis.' : 'Mit regelmäßigem Training kannst du deinen VO2max steigern.',
    })
  }

  // Calories milestone
  if (workout.calories && workout.calories > 500) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      title: `${workout.calories} kcal verbrannt`,
      detail: 'Großartige Energiebilanz! Denke an ausreichend Kohlenhydrate zur Muskelregeneration.',
    })
  }

  // Training load status
  const weeklyTRIMP = recentWorkouts
    .filter(w => w.startTime > Date.now() - 7 * 86400000)
    .reduce((sum, w) => sum + (w.trimp ?? 0), 0) + trimp

  const trainingLoadStatus = weeklyTRIMP < 150 ? 'low'
    : weeklyTRIMP < 350 ? 'optimal'
    : weeklyTRIMP < 500 ? 'high'
    : 'overreaching'

  const { hours, message } = getRecoveryMessage(trimp)

  return {
    workoutId: workout.id,
    performanceScore: score,
    insights: insights.slice(0, 4),
    recoveryAdvice: message,
    recoveryHours: hours,
    scienceTip: getDailyTip(workout.type),
    trainingLoadStatus,
  }
}

function calculatePerformanceScore(workout: Workout, history: Workout[]): number {
  if (history.length === 0) return 70 // Default for first workout

  let score = 70
  const weights = { duration: 0.3, distance: 0.4, pace: 0.3 }

  // Duration score
  const avgDuration = history.reduce((a, w) => a + w.duration, 0) / history.length
  const durationRatio = workout.duration / avgDuration
  score += (durationRatio - 1) * 30 * weights.duration

  // Distance score
  if (workout.distance) {
    const avgDist = history.filter(w => w.distance).reduce((a, w) => a + (w.distance ?? 0), 0)
      / history.filter(w => w.distance).length || 1
    const distRatio = workout.distance / avgDist
    score += (distRatio - 1) * 30 * weights.distance
  }

  // Pace score (lower is better)
  if (workout.avgPace && workout.type === 'run') {
    const paceHistory = history.filter(w => w.avgPace && w.avgPace > 0)
    if (paceHistory.length > 0) {
      const avgPace = paceHistory.reduce((a, w) => a + (w.avgPace ?? 0), 0) / paceHistory.length
      const paceRatio = avgPace / workout.avgPace // >1 means faster
      score += (paceRatio - 1) * 30 * weights.pace
    }
  }

  return Math.min(100, Math.max(1, Math.round(score)))
}

function activityLabel(type: string): string {
  const m: Record<string, string> = { run: 'Laufen', ride: 'Radfahren', hike: 'Wandern', strength: 'Kraftsport' }
  return m[type] || type
}
