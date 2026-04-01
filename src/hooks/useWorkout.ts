import { useEffect, useRef, useCallback } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { gpsTracker } from '../services/gpsTracker'
import type { ActivityType } from '../types'

export function useWorkout() {
  const store = useWorkoutStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startSecRef = useRef<number>(0)
  const pausedSecsRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)

  const startWorkout = useCallback((type: ActivityType) => {
    store.startWorkout(type)
    startSecRef.current = Date.now()
    pausedSecsRef.current = 0

    // Start timer
    timerRef.current = setInterval(() => {
      if (!useWorkoutStore.getState().active?.isPaused) {
        const elapsed = Math.floor((Date.now() - startSecRef.current - pausedSecsRef.current) / 1000)
        store.updateDuration(elapsed)
      }
    }, 1000)

    // Start GPS for non-strength activities
    if (type !== 'strength') {
      gpsTracker.start(
        (point) => store.addGpsPoint(point),
        (err) => console.warn('GPS error:', err.message)
      )
    }
  }, [store])

  const pauseWorkout = useCallback(() => {
    store.pauseWorkout()
    pauseStartRef.current = Date.now()
    gpsTracker.stop()
  }, [store])

  const resumeWorkout = useCallback(() => {
    pausedSecsRef.current += Date.now() - pauseStartRef.current
    store.resumeWorkout()
    const active = useWorkoutStore.getState().active
    if (active?.type !== 'strength') {
      gpsTracker.start(
        (point) => store.addGpsPoint(point),
        (err) => console.warn('GPS error:', err.message)
      )
    }
  }, [store])

  const stopWorkout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    gpsTracker.stop()
    // Don't call store.stopWorkout() here – caller decides after saving
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      gpsTracker.stop()
    }
  }, [])

  return { active: store.active, startWorkout, pauseWorkout, resumeWorkout, stopWorkout, addSet: store.addSet }
}
