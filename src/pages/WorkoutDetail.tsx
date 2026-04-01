import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { db } from '../db/database'
import { useUserStore } from '../store/userStore'
import { getHrZones, formatDuration, formatDistance, formatPace, activityLabel, activityEmoji } from '../utils/calculations'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { Workout } from '../types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const [workout, setWorkout] = useState<Workout | null>(null)

  useEffect(() => {
    if (id) db.workouts.get(parseInt(id)).then(w => setWorkout(w ?? null))
  }, [id])

  if (!workout) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted">Laden...</div>
      </div>
    )
  }

  const mapRoute: [number, number][] = workout.route?.map(p => [p.lat, p.lng]) ?? []
  const mapCenter: [number, number] = mapRoute.length > 0 ? mapRoute[0] : [48.1351, 11.5820]

  const hrZoneDefs = getHrZones(profile.maxHr)
  const hrChartData = workout.heartRate?.map((p, i) => ({
    t: i,
    bpm: p.bpm,
  }))

  const paceChartData = workout.route?.map((p, i) => ({
    d: Math.round((workout.distance ?? 0) / (workout.route?.length ?? 1) * i / 1000 * 10) / 10,
    speed: p.speed ? Math.round(p.speed * 3.6 * 10) / 10 : 0,
  })).filter(p => p.speed > 0)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activityEmoji(workout.type)}</span>
            <h1 className="text-xl font-bold text-text-primary">{activityLabel(workout.type)}</h1>
          </div>
          <p className="text-muted text-sm">{format(workout.startTime, 'EEEE, dd. MMMM yyyy', { locale: de })}</p>
        </div>
        <button
          onClick={() => navigate(`/workout/${id}/feedback`)}
          className="text-accent"
        >
          <MessageSquare size={20} />
        </button>
      </div>

      {/* Map */}
      {mapRoute.length > 1 && (
        <div className="h-56 mx-4 rounded-card overflow-hidden border border-white/5 mb-4">
          <MapContainer center={mapCenter} zoom={14} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={mapRoute} color="#00d4ff" weight={4} opacity={0.9} />
          </MapContainer>
        </div>
      )}

      <div className="px-4 space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <div className="text-2xl font-bold text-accent">{formatDuration(workout.duration)}</div>
            <div className="text-xs text-muted mt-1">Dauer</div>
          </Card>
          {workout.distance ? (
            <Card className="text-center">
              <div className="text-2xl font-bold text-purple">{formatDistance(workout.distance)}</div>
              <div className="text-xs text-muted mt-1">Distanz</div>
            </Card>
          ) : (
            <Card className="text-center">
              <div className="text-2xl font-bold text-purple">{workout.sets?.length ?? 0}</div>
              <div className="text-xs text-muted mt-1">Sätze</div>
            </Card>
          )}
          {workout.avgHeartRate ? (
            <Card className="text-center">
              <div className="text-2xl font-bold text-danger">{workout.avgHeartRate}</div>
              <div className="text-xs text-muted mt-1">Ø Herzfrequenz</div>
            </Card>
          ) : null}
          {workout.calories ? (
            <Card className="text-center">
              <div className="text-2xl font-bold text-warning">{workout.calories}</div>
              <div className="text-xs text-muted mt-1">kcal</div>
            </Card>
          ) : null}
          {workout.avgPace ? (
            <Card className="text-center">
              <div className="text-2xl font-bold text-success">{formatPace(workout.avgPace)}</div>
              <div className="text-xs text-muted mt-1">min/km</div>
            </Card>
          ) : null}
          {workout.elevationGain ? (
            <Card className="text-center">
              <div className="text-2xl font-bold text-accent">{Math.round(workout.elevationGain)}</div>
              <div className="text-xs text-muted mt-1">Höhenmeter ↑</div>
            </Card>
          ) : null}
        </div>

        {/* HR Chart */}
        {hrChartData && hrChartData.length > 5 && (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              ❤️ Herzfrequenz
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={hrChartData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: number) => [`${v} bpm`, 'HR']}
                />
                <Area type="monotone" dataKey="bpm" stroke="#ef4444" fill="url(#hrGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Speed/Pace Chart */}
        {paceChartData && paceChartData.length > 5 && (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">⚡ Geschwindigkeit</h3>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={paceChartData}>
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={(v: number) => [`${v} km/h`, 'Speed']}
                />
                <Area type="monotone" dataKey="speed" stroke="#00d4ff" fill="url(#speedGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* HR Zones */}
        {workout.hrZones && (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">🎯 Herzfrequenz-Zonen</h3>
            <div className="space-y-2">
              {hrZoneDefs.map(zone => {
                const key = `z${zone.zone}` as keyof typeof workout.hrZones
                const pct = workout.hrZones![key] ?? 0
                return (
                  <div key={zone.zone} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-20">{zone.name}</span>
                    <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: zone.color }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Strength Sets */}
        {workout.sets && workout.sets.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">🏋️ Sätze</h3>
            <div className="space-y-1.5">
              {workout.sets.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{i + 1}. {s.exercise}</span>
                  <Badge variant="accent">{s.weight}kg × {s.reps}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Effort score */}
        {workout.effortScore && (
          <Card className="flex items-center gap-3">
            <div className="text-3xl font-bold text-accent">{workout.effortScore}</div>
            <div>
              <div className="text-sm font-medium text-text-primary">Performance Score</div>
              <div className="text-xs text-muted">TRIMP: {workout.trimp ?? '--'}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
