import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Play, Pause, Square, Plus, Heart } from 'lucide-react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import { db } from '../db/database'
import { useWorkout } from '../hooks/useWorkout'
import { useUserStore } from '../store/userStore'
import { calculateTRIMP, formatDuration, formatDistance, formatPace, activityLabel, activityEmoji } from '../utils/calculations'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { ActivityType, StrengthSet, Workout } from '../types'

const EXERCISES = ['Bankdrücken', 'Kniebeugen', 'Kreuzheben', 'Klimmzüge', 'Schulterdrücken', 'Rudern', 'Dips', 'Bizepscurl', 'Trizepsdrücken', 'Beinpresse']

function MapAutoCenter({ route }: { route: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (route.length > 0) {
      map.setView(route[route.length - 1], map.getZoom())
    }
  }, [route, map])
  return null
}

export function NewWorkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useUserStore()
  const { active, startWorkout, pauseWorkout, resumeWorkout, stopWorkout, addSet } = useWorkout()

  const initialType = (searchParams.get('type') ?? 'run') as ActivityType
  const [selectedType, setSelectedType] = useState<ActivityType>(initialType)
  const [phase, setPhase] = useState<'select' | 'tracking' | 'done'>('select')
  const [manualHr, setManualHr] = useState('')
  const [setForm, setSetForm] = useState({ exercise: EXERCISES[0], weight: '60', reps: '8' })
  const [showSetForm, setShowSetForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasGps = selectedType !== 'strength'

  const handleStart = () => {
    startWorkout(selectedType)
    setPhase('tracking')
  }

  const handleStop = async () => {
    stopWorkout()
    setSaving(true)

    const a = active!
    const endTime = Date.now()
    const avgHr = a.heartRateData.length > 0
      ? Math.round(a.heartRateData.reduce((s, p) => s + p.bpm, 0) / a.heartRateData.length)
      : undefined

    const trimp = avgHr
      ? calculateTRIMP(a.duration, avgHr, profile.restingHr, profile.maxHr)
      : Math.round(a.duration / 60 * 2)

    const workout: Workout = {
      type: a.type,
      startTime: a.startTime,
      endTime,
      duration: a.duration,
      distance: a.distance > 0 ? a.distance : undefined,
      elevationGain: a.elevationGain > 0 ? a.elevationGain : undefined,
      calories: a.calories,
      avgHeartRate: avgHr,
      avgPace: a.currentPace > 0 ? a.currentPace : undefined,
      avgSpeed: a.currentSpeed > 0 ? a.currentSpeed : undefined,
      route: a.route.length > 0 ? a.route : undefined,
      heartRate: a.heartRateData.length > 0 ? a.heartRateData : undefined,
      sets: a.sets.length > 0 ? a.sets : undefined,
      trimp,
      feedbackSeen: false,
    }

    const id = await db.workouts.add(workout)
    setSaving(false)
    navigate(`/workout/${id}/feedback`)
  }

  const handleAddSet = () => {
    addSet({
      exercise: setForm.exercise,
      weight: parseFloat(setForm.weight),
      reps: parseInt(setForm.reps),
    })
    setShowSetForm(false)
  }

  const mapRoute: [number, number][] = active?.route.map(p => [p.lat, p.lng]) ?? []
  const mapCenter: [number, number] = mapRoute.length > 0 ? mapRoute[mapRoute.length - 1] : [48.1351, 11.5820]

  if (phase === 'select') {
    return (
      <div className="px-4 pt-6 pb-8 space-y-6">
        <div>
          <button onClick={() => navigate('/')} className="text-muted text-sm mb-4">← Zurück</button>
          <h1 className="text-2xl font-bold text-text-primary">Training starten</h1>
          <p className="text-text-secondary text-sm mt-1">Wähle deine Aktivität</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(['run', 'ride', 'hike', 'strength'] as ActivityType[]).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-card p-5 border flex flex-col items-center gap-2 transition-all ${
                selectedType === type
                  ? 'border-accent bg-accent/10 shadow-glow'
                  : 'border-white/10 bg-surface'
              }`}
            >
              <span className="text-3xl">{activityEmoji(type)}</span>
              <span className="font-medium text-sm text-text-primary">{activityLabel(type)}</span>
            </button>
          ))}
        </div>

        <Button size="lg" fullWidth onClick={handleStart}>
          <div className="flex items-center justify-center gap-2">
            <Play size={18} />
            {activityLabel(selectedType)} starten
          </div>
        </Button>
      </div>
    )
  }

  if (!active) return null

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* Map for GPS activities */}
      {hasGps && (
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapRoute.length > 1 && (
              <Polyline positions={mapRoute} color="#00d4ff" weight={4} opacity={0.9} />
            )}
            <MapAutoCenter route={mapRoute} />
          </MapContainer>
          {/* Overlay badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge variant={active.isPaused ? 'warning' : 'accent'} size="md">
              {active.isPaused ? '⏸ Pausiert' : '● Live'}
            </Badge>
          </div>
        </div>
      )}

      {/* Metrics Panel */}
      <div className={`${hasGps ? 'h-auto' : 'flex-1'} bg-surface border-t border-white/5 px-4 pt-4 pb-2`}>
        {/* Timer + type */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold text-accent font-mono text-glow">
              {formatDuration(active.duration)}
            </div>
            <div className="text-xs text-muted mt-0.5">{activityEmoji(active.type)} {activityLabel(active.type)}</div>
          </div>
          {active.currentHeartRate > 0 && (
            <div className="flex items-center gap-1 bg-danger/15 rounded-lg px-3 py-2">
              <Heart size={16} className="text-danger" />
              <span className="text-danger font-bold">{active.currentHeartRate}</span>
              <span className="text-muted text-xs">bpm</span>
            </div>
          )}
        </div>

        {/* GPS Metrics */}
        {hasGps && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-text-primary">{formatDistance(active.distance)}</div>
              <div className="text-xs text-muted">Distanz</div>
            </div>
            {active.type === 'run' || active.type === 'hike' ? (
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary">{formatPace(active.currentPace)}</div>
                <div className="text-xs text-muted">min/km</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary">{active.currentSpeed.toFixed(1)}</div>
                <div className="text-xs text-muted">km/h</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-xl font-bold text-text-primary">{Math.round(active.elevationGain)}</div>
              <div className="text-xs text-muted">Höhenmeter</div>
            </div>
          </div>
        )}

        {/* Strength: Sets */}
        {active.type === 'strength' && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">{active.sets.length} Sätze</span>
              <button onClick={() => setShowSetForm(!showSetForm)} className="text-accent text-sm flex items-center gap-1">
                <Plus size={14} /> Satz hinzufügen
              </button>
            </div>
            {showSetForm && (
              <Card className="space-y-3">
                <select
                  value={setForm.exercise}
                  onChange={e => setSetForm(s => ({ ...s, exercise: e.target.value }))}
                  className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
                >
                  {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted">Gewicht (kg)</label>
                    <input
                      type="number"
                      value={setForm.weight}
                      onChange={e => setSetForm(s => ({ ...s, weight: e.target.value }))}
                      className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted">Wdh.</label>
                    <input
                      type="number"
                      value={setForm.reps}
                      onChange={e => setSetForm(s => ({ ...s, reps: e.target.value }))}
                      className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10 mt-1"
                    />
                  </div>
                </div>
                <Button size="sm" fullWidth onClick={handleAddSet}>Satz speichern</Button>
              </Card>
            )}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {active.sets.slice(-5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-surface-2 rounded-lg px-3 py-1.5">
                  <span className="text-text-primary">{s.exercise}</span>
                  <span className="text-accent font-medium">{s.weight}kg × {s.reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual HR input */}
        <div className="flex items-center gap-2 mb-4">
          <Heart size={14} className="text-muted" />
          <input
            type="number"
            placeholder="Herzfrequenz manuell eingeben"
            value={manualHr}
            onChange={e => setManualHr(e.target.value)}
            onBlur={() => {
              const bpm = parseInt(manualHr)
              if (bpm > 30 && bpm < 250) {
                // addHeartRatePoint would be called from the store
              }
            }}
            className="flex-1 bg-surface-2 text-text-secondary rounded-lg px-3 py-1.5 text-sm border border-white/10 placeholder:text-muted"
          />
        </div>

        {/* Calories */}
        <div className="text-center text-xs text-muted mb-3">
          🔥 {active.calories} kcal verbrannt
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pb-2">
          <button
            onClick={active.isPaused ? resumeWorkout : pauseWorkout}
            className="flex-1 bg-surface-2 border border-white/10 rounded-lg py-3 flex items-center justify-center gap-2 text-text-secondary active:scale-95 transition-transform"
          >
            {active.isPaused ? <Play size={20} /> : <Pause size={20} />}
            <span className="text-sm">{active.isPaused ? 'Fortsetzen' : 'Pause'}</span>
          </button>
          <button
            onClick={handleStop}
            disabled={saving || active.duration < 10}
            className="flex-1 bg-danger/20 border border-danger/30 text-danger rounded-lg py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Square size={20} />
            <span className="text-sm">{saving ? 'Speichern...' : 'Beenden'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
