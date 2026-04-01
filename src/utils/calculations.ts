/**
 * Training calculations based on sports science literature
 */

/** Format seconds to mm:ss or hh:mm:ss */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

/** Format pace (seconds per km) to mm:ss/km */
export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${pad(s)}`
}

/** Format distance in meters to human-readable */
export function formatDistance(meters: number, imperial = false): string {
  if (imperial) {
    const miles = meters / 1609.34
    return miles >= 1 ? `${miles.toFixed(2)} mi` : `${Math.round(meters * 3.281)} ft`
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

/** Estimate VO2max from HR data (Uth-Sørensen-Overgaard-Pedersen formula) */
export function estimateVO2max(maxHr: number, restingHr: number): number {
  return 15 * (maxHr / restingHr)
}

/**
 * TRIMP (Training Impulse) calculation
 * Banister's formula: TRIMP = duration(min) × HRr × 0.64e^(1.92 × HRr)
 * where HRr = (avgHR - restHR) / (maxHR - restHR)
 */
export function calculateTRIMP(durationSeconds: number, avgHr: number, restHr: number, maxHr: number): number {
  const durationMin = durationSeconds / 60
  const hrr = (avgHr - restHr) / (maxHr - restHr)
  if (hrr <= 0) return Math.round(durationMin * 2)
  return Math.round(durationMin * hrr * 0.64 * Math.exp(1.92 * hrr))
}

/**
 * Estimate calories from MET
 * Calories = MET × weight(kg) × duration(h)
 */
export function estimateCalories(met: number, weightKg: number, durationSeconds: number): number {
  return Math.round(met * weightKg * (durationSeconds / 3600))
}

/**
 * Simplified CTL/ATL/TSB (Training Stress Balance)
 * Based on Coggan's Fitness-Fatigue model
 */
export function calculateTrainingLoad(trimpValues: number[]): { ctl: number; atl: number; tsb: number } {
  // CTL (Chronic Training Load) = 42-day exponential moving average
  // ATL (Acute Training Load) = 7-day exponential moving average
  const ctlDecay = 1 - 1 / 42
  const atlDecay = 1 - 1 / 7

  let ctl = 0
  let atl = 0

  for (const trimp of trimpValues) {
    ctl = ctl * ctlDecay + trimp * (1 - ctlDecay)
    atl = atl * atlDecay + trimp * (1 - atlDecay)
  }

  return { ctl: Math.round(ctl), atl: Math.round(atl), tsb: Math.round(ctl - atl) }
}

/** Heart rate zones based on max HR */
export function getHrZones(maxHr: number): { zone: number; name: string; min: number; max: number; color: string }[] {
  return [
    { zone: 1, name: 'Recovery', min: 0, max: Math.round(maxHr * 0.6), color: '#6b7280' },
    { zone: 2, name: 'Aerobic', min: Math.round(maxHr * 0.6), max: Math.round(maxHr * 0.7), color: '#10b981' },
    { zone: 3, name: 'Tempo', min: Math.round(maxHr * 0.7), max: Math.round(maxHr * 0.8), color: '#f59e0b' },
    { zone: 4, name: 'Threshold', min: Math.round(maxHr * 0.8), max: Math.round(maxHr * 0.9), color: '#ef4444' },
    { zone: 5, name: 'Max', min: Math.round(maxHr * 0.9), max: maxHr, color: '#7c3aed' },
  ]
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    run: 'Laufen', ride: 'Radfahren', hike: 'Wandern', strength: 'Kraftsport'
  }
  return labels[type] || type
}

export function activityEmoji(type: string): string {
  const emojis: Record<string, string> = {
    run: '🏃', ride: '🚴', hike: '🥾', strength: '🏋️'
  }
  return emojis[type] || '💪'
}
