import { create } from 'zustand'
import { getProfile, saveProfile } from '../db/database'
import type { UserProfile } from '../types'

interface UserStore {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile: getProfile(),
  updateProfile: (updates) =>
    set((s) => {
      const profile = { ...s.profile, ...updates }
      saveProfile(profile)
      return { profile }
    }),
}))
