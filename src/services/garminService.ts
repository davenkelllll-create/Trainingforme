/**
 * Garmin Connect API stub
 *
 * Full integration requires:
 * 1. Register at https://developer.garmin.com/gc-developer-program/overview/
 * 2. Set up OAuth 1.0a with Consumer Key/Secret
 * 3. Backend proxy for token exchange (due to CORS)
 *
 * This stub provides the UI flow and data structure.
 */

const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauthConfirm'
const STORAGE_KEY = 'tfm_garmin_token'

export interface GarminActivity {
  activityId: string
  activityName: string
  activityType: { typeKey: string }
  startTimeLocal: string
  duration: number
  distance: number
  averageHR?: number
  maxHR?: number
  calories: number
  elevationGain?: number
  averageSpeed?: number
}

export const garminService = {
  isConnected(): boolean {
    return !!localStorage.getItem(STORAGE_KEY)
  },

  /**
   * Initiates Garmin OAuth flow.
   * In production, redirect to your backend which handles OAuth token exchange.
   */
  connect(): void {
    // In production: redirect to backend OAuth handler
    // For demo: simulate connection
    const demo = window.confirm(
      'Garmin Connect-Integration\n\n' +
      'Für die vollständige Integration benötigst du:\n' +
      '1. Garmin Developer Account\n' +
      '2. Backend-Server für OAuth\n\n' +
      'Demo-Modus aktivieren?'
    )
    if (demo) {
      localStorage.setItem(STORAGE_KEY, 'demo_token')
      window.location.reload()
    }
  },

  disconnect(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  /**
   * Fetch recent activities from Garmin Connect API
   * Requires backend proxy due to CORS
   */
  async fetchActivities(limit = 20): Promise<GarminActivity[]> {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) throw new Error('Not connected to Garmin')

    if (token === 'demo_token') {
      return [] // Demo mode returns empty (use local data instead)
    }

    // Production: fetch from your backend proxy
    const resp = await fetch(`/api/garmin/activities?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error('Failed to fetch Garmin activities')
    return resp.json()
  },
}
