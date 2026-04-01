import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Save, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { db } from '../db/database'
import { calculateTRIMP } from '../utils/calculations'
import { useUserStore } from '../store/userStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import type { ActivityType, Workout } from '../types'
import { format } from 'date-fns'

type Section = 'basic' | 'hr' | 'performance' | 'garmin' | 'notes'

const ACTIVITY_TEMPLATES: Record<ActivityType, string[]> = {
  run: ['Einfacher Lauf', 'Intervalltraining', 'Long Run', 'Tempolauf', 'Berglauf', 'Wettkampf'],
  ride: ['Grundlagentraining', 'Intervalle', 'Bergfahrt', 'Gran Fondo', 'Recovery Ride', 'Rennen'],
  hike: ['Wanderung', 'Bergtour', 'Tageswanderung', 'Radwanderung'],
  strength: ['Oberkörper', 'Unterkörper', 'Ganzkörper', 'Push', 'Pull', 'Beine', 'Core'],
}

const DEFAULT_FORM = {
  type: 'run' as ActivityType,
  subtype: '',
  date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  duration: '',          // mm:ss or h:mm:ss
  distance: '',          // km
  elevationGain: '',     // m
  avgHeartRate: '',
  maxHeartRate: '',
  calories: '',
  avgPace: '',           // min:sec /km
  avgSpeed: '',          // km/h
  // HR Zones %
  z1: '', z2: '', z3: '', z4: '', z5: '',
  // Garmin-specific
  trainingEffect: '',         // 1.0–5.0 aerobic
  anaerobicTE: '',            // 0.0–5.0
  trainingLoad: '',           // Garmin Training Load Points
  normalizedPower: '',        // NP in Watt (cycling)
  intensityFactor: '',        // IF
  tss: '',                    // Training Stress Score
  avgCadence: '',             // rpm / steps/min
  maxCadence: '',
  avgPower: '',               // Watt
  maxPower: '',
  groundContactTime: '',      // ms (running)
  verticalOscillation: '',    // cm
  strideLength: '',           // m
  trainingStatus: '',         // Garmin Training Status label
  vo2maxEstimate: '',         // Garmin VO2max estimate
  notes: '',
}

function parseDuration(s: string): number {
  const parts = s.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parseInt(s) || 0
}

function parsePace(s: string): number {
  const parts = s.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export function ManualEntry() {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [open, setOpen] = useState<Set<Section>>(new Set(['basic']))
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const toggle = (s: Section) => setOpen(prev => {
    const next = new Set(prev)
    next.has(s) ? next.delete(s) : next.add(s)
    return next
  })

  const handleSave = async () => {
    if (!form.duration) return
    setSaving(true)

    const startTime = new Date(form.date).getTime()
    const duration = parseDuration(form.duration)
    const avgHr = form.avgHeartRate ? parseInt(form.avgHeartRate) : undefined
    const trimp = avgHr
      ? calculateTRIMP(duration, avgHr, profile.restingHr, profile.maxHr)
      : undefined

    const hrZonesEntered = [form.z1, form.z2, form.z3, form.z4, form.z5].some(z => z !== '')
    const hrZones = hrZonesEntered ? {
      z1: parseInt(form.z1) || 0,
      z2: parseInt(form.z2) || 0,
      z3: parseInt(form.z3) || 0,
      z4: parseInt(form.z4) || 0,
      z5: parseInt(form.z5) || 0,
    } : undefined

    const workout: Workout = {
      type: form.type,
      startTime,
      endTime: startTime + duration * 1000,
      duration,
      distance: form.distance ? parseFloat(form.distance) * 1000 : undefined,
      elevationGain: form.elevationGain ? parseFloat(form.elevationGain) : undefined,
      avgHeartRate: avgHr,
      maxHeartRate: form.maxHeartRate ? parseInt(form.maxHeartRate) : undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      avgPace: form.avgPace ? parsePace(form.avgPace) : undefined,
      avgSpeed: form.avgSpeed ? parseFloat(form.avgSpeed) : undefined,
      hrZones,
      trimp,
      notes: [
        form.subtype,
        form.trainingEffect ? `Aerobic TE: ${form.trainingEffect}` : '',
        form.anaerobicTE ? `Anaerobic TE: ${form.anaerobicTE}` : '',
        form.trainingLoad ? `Training Load: ${form.trainingLoad}` : '',
        form.normalizedPower ? `NP: ${form.normalizedPower}W` : '',
        form.tss ? `TSS: ${form.tss}` : '',
        form.avgCadence ? `Ø Kadenz: ${form.avgCadence}` : '',
        form.avgPower ? `Ø Leistung: ${form.avgPower}W` : '',
        form.groundContactTime ? `Bodenkontaktzeit: ${form.groundContactTime}ms` : '',
        form.verticalOscillation ? `Vertikale Schwingung: ${form.verticalOscillation}cm` : '',
        form.strideLength ? `Schrittlänge: ${form.strideLength}m` : '',
        form.trainingStatus ? `Garmin Status: ${form.trainingStatus}` : '',
        form.vo2maxEstimate ? `VO2max (Garmin): ${form.vo2maxEstimate}` : '',
        form.notes,
      ].filter(Boolean).join(' | ') || undefined,
      feedbackSeen: false,
    }

    const id = await db.workouts.add(workout)
    setSaving(false)
    navigate(`/workout/${id}/feedback`)
  }

  const SectionHeader = ({ id, title, icon }: { id: Section; title: string; icon: string }) => (
    <button
      onClick={() => toggle(id)}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <span className="font-medium text-text-primary flex items-center gap-2">
        <span>{icon}</span> {title}
      </span>
      {open.has(id) ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
    </button>
  )

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted"><ChevronLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Manuell erfassen</h1>
          <p className="text-muted text-xs">Garmin-Daten manuell übertragen</p>
        </div>
      </div>

      {/* Garmin hint */}
      <Card className="flex items-start gap-3 border-accent/20 bg-accent/5">
        <Info size={16} className="text-accent mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-secondary">
          Öffne Garmin Connect → wähle deine Aktivität → tippe auf alle Werte und trage sie hier ein. Alle Felder außer Dauer sind optional.
        </p>
      </Card>

      {/* Activity Type */}
      <Card>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['run', 'ride', 'hike', 'strength'] as ActivityType[]).map(t => (
            <button key={t} onClick={() => set('type', t)}
              className={`py-2 rounded-lg text-lg transition-colors ${form.type === t ? 'bg-accent/20 border border-accent/40' : 'bg-surface-2'}`}>
              {t === 'run' ? '🏃' : t === 'ride' ? '🚴' : t === 'hike' ? '🥾' : '🏋️'}
            </button>
          ))}
        </div>
        <select value={form.subtype} onChange={e => set('subtype', e.target.value)}
          className="form-input">
          <option value="">Trainingstyp wählen (optional)</option>
          {ACTIVITY_TEMPLATES[form.type].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>

      {/* Basic Section */}
      <Card>
        <SectionHeader id="basic" title="Basisdaten" icon="📋" />
        {open.has('basic') && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-muted block mb-1">Datum & Uhrzeit *</label>
              <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Dauer * (h:mm:ss oder mm:ss)</label>
              <input type="text" placeholder="z.B. 1:02:34 oder 45:00" value={form.duration} onChange={e => set('duration', e.target.value)} className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">Distanz (km)</label>
                <input type="number" step="0.01" placeholder="z.B. 10.5" value={form.distance} onChange={e => set('distance', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Höhenmeter (m)</label>
                <input type="number" placeholder="z.B. 245" value={form.elevationGain} onChange={e => set('elevationGain', e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">
                  {form.type === 'ride' ? 'Ø Geschw. (km/h)' : 'Ø Pace (min:ss/km)'}
                </label>
                {form.type === 'ride'
                  ? <input type="number" step="0.1" placeholder="z.B. 28.5" value={form.avgSpeed} onChange={e => set('avgSpeed', e.target.value)} className="form-input" />
                  : <input type="text" placeholder="z.B. 5:30" value={form.avgPace} onChange={e => set('avgPace', e.target.value)} className="form-input" />
                }
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Kalorien (kcal)</label>
                <input type="number" placeholder="z.B. 540" value={form.calories} onChange={e => set('calories', e.target.value)} className="form-input" />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* HR Section */}
      <Card>
        <SectionHeader id="hr" title="Herzfrequenz" icon="❤️" />
        {open.has('hr') && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">Ø HF (bpm)</label>
                <input type="number" placeholder="z.B. 152" value={form.avgHeartRate} onChange={e => set('avgHeartRate', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Max HF (bpm)</label>
                <input type="number" placeholder="z.B. 178" value={form.maxHeartRate} onChange={e => set('maxHeartRate', e.target.value)} className="form-input" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">HF-Zonen (%)</label>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { key: 'z1', label: 'Z1', color: 'text-gray-400' },
                  { key: 'z2', label: 'Z2', color: 'text-success' },
                  { key: 'z3', label: 'Z3', color: 'text-warning' },
                  { key: 'z4', label: 'Z4', color: 'text-danger' },
                  { key: 'z5', label: 'Z5', color: 'text-purple' },
                ].map(z => (
                  <div key={z.key} className="text-center">
                    <div className={`text-xs font-medium mb-1 ${z.color}`}>{z.label}</div>
                    <input type="number" min="0" max="100" placeholder="0"
                      value={form[z.key as keyof typeof form]}
                      onChange={e => set(z.key, e.target.value)}
                      className="form-input text-center px-1" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-1">Aus Garmin Connect → Herzfrequenz-Tab</p>
            </div>
          </div>
        )}
      </Card>

      {/* Performance Section */}
      <Card>
        <SectionHeader id="performance" title="Leistung & Laufökonomie" icon="⚡" />
        {open.has('performance') && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">Ø Kadenz (rpm/spm)</label>
                <input type="number" placeholder="z.B. 86" value={form.avgCadence} onChange={e => set('avgCadence', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Max Kadenz</label>
                <input type="number" placeholder="z.B. 102" value={form.maxCadence} onChange={e => set('maxCadence', e.target.value)} className="form-input" />
              </div>
            </div>
            {(form.type === 'ride') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted block mb-1">Norm. Leistung (NP, W)</label>
                  <input type="number" placeholder="z.B. 210" value={form.normalizedPower} onChange={e => set('normalizedPower', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Ø Leistung (W)</label>
                  <input type="number" placeholder="z.B. 195" value={form.avgPower} onChange={e => set('avgPower', e.target.value)} className="form-input" />
                </div>
              </div>
            )}
            {(form.type === 'run') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted block mb-1">Bodenkontaktzeit (ms)</label>
                  <input type="number" placeholder="z.B. 245" value={form.groundContactTime} onChange={e => set('groundContactTime', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Vert. Schwingung (cm)</label>
                  <input type="number" step="0.1" placeholder="z.B. 8.5" value={form.verticalOscillation} onChange={e => set('verticalOscillation', e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Schrittlänge (m)</label>
                  <input type="number" step="0.01" placeholder="z.B. 1.28" value={form.strideLength} onChange={e => set('strideLength', e.target.value)} className="form-input" />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Garmin Specific */}
      <Card>
        <SectionHeader id="garmin" title="Garmin-Kennwerte" icon="🟢" />
        {open.has('garmin') && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">Aerobic Training Effect</label>
                <input type="number" step="0.1" min="0" max="5" placeholder="0.0–5.0" value={form.trainingEffect} onChange={e => set('trainingEffect', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Anaerobic Training Effect</label>
                <input type="number" step="0.1" min="0" max="5" placeholder="0.0–5.0" value={form.anaerobicTE} onChange={e => set('anaerobicTE', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Training Load (Punkte)</label>
                <input type="number" placeholder="z.B. 145" value={form.trainingLoad} onChange={e => set('trainingLoad', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">TSS (Training Stress Score)</label>
                <input type="number" placeholder="z.B. 68" value={form.tss} onChange={e => set('tss', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Intensity Factor (IF)</label>
                <input type="number" step="0.01" placeholder="z.B. 0.82" value={form.intensityFactor} onChange={e => set('intensityFactor', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">VO2max (Garmin)</label>
                <input type="number" step="0.1" placeholder="z.B. 52.0" value={form.vo2maxEstimate} onChange={e => set('vo2maxEstimate', e.target.value)} className="form-input" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Garmin Training Status</label>
              <select value={form.trainingStatus} onChange={e => set('trainingStatus', e.target.value)} className="form-input">
                <option value="">– kein –</option>
                {['Peaking', 'Productive', 'Maintaining', 'Recovery', 'Unproductive', 'Detraining', 'Overreaching'].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <SectionHeader id="notes" title="Notizen" icon="📝" />
        {open.has('notes') && (
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Wie hat sich das Training angefühlt? Besonderheiten?"
            className="form-input resize-none w-full"
          />
        )}
      </Card>

      <Button size="lg" fullWidth onClick={handleSave} disabled={!form.duration || saving}>
        <div className="flex items-center justify-center gap-2">
          <Save size={18} />
          {saving ? 'Wird gespeichert...' : 'Training speichern & Feedback'}
        </div>
      </Button>
    </div>
  )
}
