import { create } from 'zustand'
import type { ActivityType, GpsPoint, HeartRatePoint, StrengthSet } from '../types'

interface ActiveWorkout {
  type: ActivityType
  startTime: number
  duration: number
  distance: number
  elevationGain: number
  currentSpeed: number
  currentPace: number
  currentHeartRate: number
  calories: number
  route: GpsPoint[]
  heartRateData: HeartRatePoint[]
  sets: StrengthSet[]
  isTracking: boolean
  isPaused: boolean
}

interface WorkoutStore {
  active: ActiveWorkout | null
  startWorkout: (type: ActivityType) => void
  stopWorkout: () => void
  pauseWorkout: () => void
  resumeWorkout: () => void
  addGpsPoint: (point: GpsPoint) => void
  addHeartRatePoint: (bpm: number) => void
  addSet: (set: StrengthSet) => void
  updateDuration: (seconds: number) => void
  updateMetrics: (metrics: Partial<ActiveWorkout>) => void
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  active: null,

  startWorkout: (type) =>
    set({
      active: {
        type,
        startTime: Date.now(),
        duration: 0,
        distance: 0,
        elevationGain: 0,
        currentSpeed: 0,
        currentPace: 0,
        currentHeartRate: 0,
        calories: 0,
        route: [],
        heartRateData: [],
        sets: [],
        isTracking: true,
        isPaused: false,
      },
    }),

  stopWorkout: () => set({ active: null }),

  pauseWorkout: () =>
    set((s) => s.active ? { active: { ...s.active, isPaused: true } } : {}),

  resumeWorkout: () =>
    set((s) => s.active ? { active: { ...s.active, isPaused: false } } : {}),

  addGpsPoint: (point) =>
    set((s) => {
      if (!s.active) return {}
      const route = [...s.active.route, point]
      let distance = s.active.distance
      let elevationGain = s.active.elevationGain

      if (route.length > 1) {
        const prev = route[route.length - 2]
        distance += haversineDistance(prev.lat, prev.lng, point.lat, point.lng)
        if (point.elevation && prev.elevation && point.elevation > prev.elevation) {
          elevationGain += point.elevation - prev.elevation
        }
      }

      const currentSpeed = point.speed ? point.speed * 3.6 : s.active.currentSpeed
      const currentPace = currentSpeed > 0.5 ? 60 / currentSpeed * 60 : s.active.currentPace

      return { active: { ...s.active, route, distance, elevationGain, currentSpeed, currentPace } }
    }),

  addHeartRatePoint: (bpm) =>
    set((s) => {
      if (!s.active) return {}
      const heartRateData = [...s.active.heartRateData, { timestamp: Date.now(), bpm }]
      return { active: { ...s.active, heartRateData, currentHeartRate: bpm } }
    }),

  addSet: (set_) =>
    set((s) => {
      if (!s.active) return {}
      return { active: { ...s.active, sets: [...s.active.sets, set_] } }
    }),

  updateDuration: (seconds) =>
    set((s) => {
      if (!s.active) return {}
      const met = getMET(s.active.type)
      const profile = JSON.parse(localStorage.getItem('tfm_user_profile') || '{}')
      const weight = profile.weight || 75
      const calories = Math.round((met * weight * seconds) / 3600)
      return { active: { ...s.active, duration: seconds, calories } }
    }),

  updateMetrics: (metrics) =>
    set((s) => s.active ? { active: { ...s.active, ...metrics } } : {}),
}))

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getMET(type: ActivityType): number {
  const mets = { run: 9.8, ride: 7.5, hike: 5.3, strength: 5.0 }
  return mets[type]
}
