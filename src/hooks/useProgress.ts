import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calculateTrainingLoad } from '../utils/calculations'
import { startOfWeek, subDays, format } from 'date-fns'

export function useWeeklyStats() {
  return useLiveQuery(async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime()
    const workouts = await db.workouts.where('startTime').aboveOrEqual(weekStart).toArray()
    return {
      count: workouts.length,
      totalDuration: workouts.reduce((a, w) => a + w.duration, 0),
      totalDistance: workouts.reduce((a, w) => a + (w.distance ?? 0), 0),
      totalCalories: workouts.reduce((a, w) => a + (w.calories ?? 0), 0),
      byType: {
        run: workouts.filter(w => w.type === 'run').length,
        ride: workouts.filter(w => w.type === 'ride').length,
        hike: workouts.filter(w => w.type === 'hike').length,
        strength: workouts.filter(w => w.type === 'strength').length,
      },
    }
  })
}

export function useStreak() {
  return useLiveQuery(async () => {
    const all = await db.workouts.orderBy('startTime').reverse().toArray()
    if (all.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const day = subDays(today, i)
      const nextDay = subDays(today, i - 1)
      const worked = all.some(w => w.startTime >= day.getTime() && w.startTime < nextDay.getTime())
      if (worked) streak++
      else if (i > 0) break
    }
    return streak
  })
}

export function useTrainingLoad() {
  return useLiveQuery(async () => {
    const since = Date.now() - 42 * 86400000
    const workouts = await db.workouts.where('startTime').above(since).sortBy('startTime')
    const trimps = workouts.map(w => w.trimp ?? 0)
    return calculateTrainingLoad(trimps)
  })
}

export function useWeeklyVolume(weeks = 8) {
  return useLiveQuery(async () => {
    const since = Date.now() - weeks * 7 * 86400000
    const workouts = await db.workouts.where('startTime').above(since).toArray()

    const result: { week: string; run: number; ride: number; hike: number; strength: number }[] = []

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 })
      const weekEnd = subDays(weekStart, -7)
      const label = format(weekStart, 'dd.MM.')

      const weekWorkouts = workouts.filter(
        w => w.startTime >= weekStart.getTime() && w.startTime < weekEnd.getTime()
      )

      result.push({
        week: label,
        run: weekWorkouts.filter(w => w.type === 'run').reduce((a, w) => a + (w.distance ?? 0) / 1000, 0),
        ride: weekWorkouts.filter(w => w.type === 'ride').reduce((a, w) => a + (w.distance ?? 0) / 1000, 0),
        hike: weekWorkouts.filter(w => w.type === 'hike').reduce((a, w) => a + (w.distance ?? 0) / 1000, 0),
        strength: weekWorkouts.filter(w => w.type === 'strength').length * 10,
      })
    }

    return result
  })
}
