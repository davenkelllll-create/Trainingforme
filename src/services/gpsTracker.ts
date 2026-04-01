import type { GpsPoint } from '../types'

type GpsCallback = (point: GpsPoint) => void
type ErrorCallback = (error: GeolocationPositionError) => void

class GpsTracker {
  private watchId: number | null = null
  private onPoint: GpsCallback | null = null
  private onError: ErrorCallback | null = null

  get isAvailable(): boolean {
    return 'geolocation' in navigator
  }

  start(onPoint: GpsCallback, onError?: ErrorCallback): void {
    if (!this.isAvailable) {
      onError?.({ code: 2, message: 'Geolocation not available', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
      return
    }

    this.onPoint = onPoint
    this.onError = onError ?? null

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          elevation: pos.coords.altitude ?? undefined,
          timestamp: pos.timestamp,
          speed: pos.coords.speed ?? undefined,
        }
        this.onPoint?.(point)
      },
      (err) => {
        this.onError?.(err)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    )
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.onPoint = null
    this.onError = null
  }
}

export const gpsTracker = new GpsTracker()
