/**
 * Polar Flow API stub
 *
 * Full integration requires:
 * 1. Register at https://www.polar.com/accesslink-api/
 * 2. OAuth 2.0 flow
 * 3. Backend proxy for token exchange
 */

const STORAGE_KEY = 'tfm_polar_token'

export const polarService = {
  isConnected(): boolean {
    return !!localStorage.getItem(STORAGE_KEY)
  },

  connect(): void {
    const demo = window.confirm(
      'Polar Flow-Integration\n\n' +
      'Für die vollständige Integration benötigst du:\n' +
      '1. Polar AccessLink API-Zugang\n' +
      '2. Backend-Server für OAuth 2.0\n\n' +
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

  async fetchActivities(): Promise<unknown[]> {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) throw new Error('Not connected to Polar')
    if (token === 'demo_token') return []

    const resp = await fetch('/api/polar/activities', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error('Failed to fetch Polar activities')
    return resp.json()
  },
}
