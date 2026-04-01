import Dexie, { type Table } from 'dexie'
import type { Workout, Goal, PersonalRecord, UserProfile, BodyMeasurement } from '../types'

export class TrainingDatabase extends Dexie {
  workouts!: Table<Workout>
  goals!: Table<Goal>
  records!: Table<PersonalRecord>
  bodyMeasurements!: Table<BodyMeasurement>

  constructor() {
    super('TrainingForMeDB')
    this.version(1).stores({
      workouts: '++id, type, startTime, endTime, effortScore',
      goals: '++id, type, activityType, completed, createdAt',
      records: '++id, activityType, metric, date',
    })
    this.version(2).stores({
      workouts: '++id, type, startTime, endTime, effortScore',
      goals: '++id, type, activityType, completed, createdAt',
      records: '++id, activityType, metric, date',
      bodyMeasurements: '++id, timestamp',
    })
  }
}

export const db = new TrainingDatabase()

// Default user profile stored in localStorage
const PROFILE_KEY = 'tfm_user_profile'

export const defaultProfile: UserProfile = {
  name: 'Athlet',
  age: 30,
  gender: 'male',
  weight: 75,
  height: 175,
  restingHr: 60,
  maxHr: 190,
  fitnessLevel: 'intermediate',
  primaryGoals: [],
  units: 'metric',
  garminConnected: false,
  polarConnected: false,
  profileComplete: false,
}

export function getProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    if (stored) return { ...defaultProfile, ...JSON.parse(stored) }
  } catch {}
  return defaultProfile
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// Seed some demo data if DB is empty
export async function seedDemoData(): Promise<void> {
  const count = await db.workouts.count()
  if (count > 0) return

  const now = Date.now()
  const day = 86400000

  const demoWorkouts: Workout[] = [
    {
      type: 'run',
      startTime: now - day * 6,
      endTime: now - day * 6 + 2700000,
      duration: 2700,
      distance: 7200,
      elevationGain: 45,
      calories: 420,
      avgHeartRate: 158,
      maxHeartRate: 178,
      avgPace: 375,
      effortScore: 72,
      trimp: 68,
      hrZones: { z1: 5, z2: 25, z3: 40, z4: 25, z5: 5 },
      feedbackSeen: true,
    },
    {
      type: 'strength',
      startTime: now - day * 4,
      endTime: now - day * 4 + 3600000,
      duration: 3600,
      calories: 280,
      avgHeartRate: 130,
      effortScore: 65,
      trimp: 42,
      sets: [
        { exercise: 'Bankdrücken', weight: 80, reps: 8 },
        { exercise: 'Bankdrücken', weight: 80, reps: 7 },
        { exercise: 'Kniebeugen', weight: 100, reps: 6 },
        { exercise: 'Kniebeugen', weight: 100, reps: 5 },
        { exercise: 'Kreuzheben', weight: 120, reps: 5 },
      ],
      feedbackSeen: true,
    },
    {
      type: 'ride',
      startTime: now - day * 2,
      endTime: now - day * 2 + 5400000,
      duration: 5400,
      distance: 32000,
      elevationGain: 280,
      calories: 680,
      avgHeartRate: 148,
      maxHeartRate: 172,
      avgSpeed: 21.3,
      effortScore: 78,
      trimp: 95,
      hrZones: { z1: 8, z2: 35, z3: 30, z4: 22, z5: 5 },
      feedbackSeen: true,
    },
    {
      type: 'run',
      startTime: now - day * 1,
      endTime: now - day * 1 + 1800000,
      duration: 1800,
      distance: 4500,
      elevationGain: 20,
      calories: 265,
      avgHeartRate: 142,
      maxHeartRate: 162,
      avgPace: 400,
      effortScore: 55,
      trimp: 35,
      hrZones: { z1: 10, z2: 50, z3: 30, z4: 10, z5: 0 },
      feedbackSeen: false,
    },
  ]

  await db.workouts.bulkAdd(demoWorkouts)

  await db.goals.bulkAdd([
    {
      type: 'distance',
      activityType: 'run',
      title: 'Monatliche Laufdistanz',
      target: 100000,
      current: 11700,
      unit: 'km',
      completed: false,
      createdAt: now - day * 10,
    },
    {
      type: 'consistency',
      title: 'Trainingsfrequenz',
      target: 4,
      current: 3,
      unit: 'mal/Woche',
      completed: false,
      createdAt: now - day * 10,
    },
    {
      type: 'weight',
      title: 'Zielgewicht',
      target: 72,
      current: 75,
      unit: 'kg',
      completed: false,
      createdAt: now - day * 10,
    },
  ])
}
