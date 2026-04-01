export type ActivityType = 'run' | 'ride' | 'hike' | 'strength'

export interface GpsPoint {
  lat: number
  lng: number
  elevation?: number
  timestamp: number
  speed?: number // m/s
}

export interface HeartRatePoint {
  timestamp: number
  bpm: number
}

export interface StrengthSet {
  exercise: string
  weight: number // kg
  reps: number
  rpe?: number // Rate of Perceived Exertion 1-10
}

export interface Workout {
  id?: number
  type: ActivityType
  startTime: number
  endTime: number
  duration: number // seconds
  distance?: number // meters
  elevationGain?: number // meters
  calories?: number
  avgHeartRate?: number
  maxHeartRate?: number
  hrZones?: HrZones
  avgPace?: number // seconds per km (running/hiking)
  avgSpeed?: number // km/h (cycling)
  route?: GpsPoint[]
  heartRate?: HeartRatePoint[]
  sets?: StrengthSet[]
  notes?: string
  effortScore?: number // 0-100
  trimp?: number
  feedbackSeen?: boolean
  garminActivityId?: string
  polarActivityId?: string
}

export interface HrZones {
  z1: number // % time in zone 1 (recovery <60%)
  z2: number // aerobic 60-70%
  z3: number // tempo 70-80%
  z4: number // threshold 80-90%
  z5: number // max >90%
}

export interface Goal {
  id?: number
  type: 'distance' | 'weight' | 'pr' | 'consistency' | 'calories'
  activityType?: ActivityType
  title: string
  description?: string
  target: number
  current: number
  unit: string
  deadline?: number // timestamp
  completed: boolean
  createdAt: number
}

export interface UserProfile {
  name: string
  age: number
  birthDate?: string    // ISO date string
  gender: Gender
  weight: number        // kg
  height: number        // cm
  restingHr: number
  maxHr: number
  ftp?: number          // Functional Threshold Power (cycling)
  fitnessLevel: FitnessLevel
  primaryGoals: string[]
  units: 'metric' | 'imperial'
  garminConnected: boolean
  polarConnected: boolean
  garminToken?: string
  polarToken?: string
  profileComplete: boolean
}

export interface WorkoutFeedback {
  workoutId: number
  performanceScore: number // 0-100
  insights: FeedbackInsight[]
  recoveryAdvice: string
  recoveryHours: number
  scienceTip: string
  trainingLoadStatus: 'low' | 'optimal' | 'high' | 'overreaching'
}

export interface FeedbackInsight {
  type: 'positive' | 'warning' | 'info'
  icon: string
  title: string
  detail: string
}

export type Gender = 'male' | 'female' | 'other'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'athlete'

export interface BodyMeasurement {
  id?: number
  timestamp: number
  weight: number        // kg
  bodyFat?: number      // %
  muscleMass?: number   // kg
  boneMass?: number     // kg
  waterPercent?: number // %
  visceralFat?: number  // index 1-20
  bmi?: number
  bmr?: number          // kcal/day
  metabolicAge?: number
  source: 'bluetooth' | 'manual'
  deviceName?: string
}

export interface PersonalRecord {
  id?: number
  activityType: ActivityType
  metric: string // e.g. "5km pace", "bench press 1RM"
  value: number
  unit: string
  workoutId: number
  date: number
}
