import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Activity, Target, Link, ChevronLeft, Check, Edit3 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { garminService } from '../services/garminService'
import { polarService } from '../services/polarService'
import { estimateVO2max } from '../utils/calculations'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScienceBadge } from '../components/ui/ScienceBadge'
import type { Gender, FitnessLevel } from '../types'

const FITNESS_LEVELS: { value: FitnessLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Einsteiger', desc: '< 6 Monate Training' },
  { value: 'intermediate', label: 'Fortgeschritten', desc: '6 Mon. – 3 Jahre' },
  { value: 'advanced', label: 'Erfahren', desc: '3–7 Jahre Training' },
  { value: 'athlete', label: 'Athlet', desc: 'Wettkampf / > 7 Jahre' },
]

const GOAL_OPTIONS = [
  'Ausdauer verbessern',
  'Muskelaufbau',
  'Gewicht reduzieren',
  'Allgemeine Fitness',
  'Wettkampfvorbereitung',
  'Stressabbau / Gesundheit',
  'Rehabilitation',
]

export function Profile() {
  const navigate = useNavigate()
  const { profile, updateProfile } = useUserStore()
  const [editing, setEditing] = useState(!profile.profileComplete)
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  const bmi = form.weight / ((form.height / 100) ** 2)
  const vo2max = estimateVO2max(form.maxHr, form.restingHr)
  const maxHrEstimate = 220 - form.age

  const handleSave = () => {
    updateProfile({ ...form, profileComplete: true })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleGoal = (goal: string) => {
    setForm(f => ({
      ...f,
      primaryGoals: f.primaryGoals.includes(goal)
        ? f.primaryGoals.filter(g => g !== goal)
        : [...f.primaryGoals, goal],
    }))
  }

  if (!editing) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <User size={24} className="text-purple" /> Profil
          </h1>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <div className="flex items-center gap-1"><Edit3 size={14} /> Bearbeiten</div>
          </Button>
        </div>

        {saved && (
          <div className="bg-success/15 border border-success/30 rounded-lg px-4 py-2 text-success text-sm flex items-center gap-2">
            <Check size={16} /> Profil gespeichert
          </div>
        )}

        {/* Avatar / Name */}
        <Card className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-3xl">
            {profile.gender === 'female' ? '👩' : '🧑'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
            <p className="text-muted text-sm">{profile.age} Jahre · {profile.height} cm · {profile.weight} kg</p>
            <Badge variant="accent" size="md">
              {FITNESS_LEVELS.find(f => f.value === profile.fitnessLevel)?.label ?? 'Fortgeschritten'}
            </Badge>
          </div>
        </Card>

        {/* Physical Stats */}
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Körper</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <div className="text-xl font-bold text-accent">{bmi.toFixed(1)}</div>
              <div className="text-xs text-muted flex items-center justify-center gap-1">
                BMI <ScienceBadge source="WHO (2000): Obesity: preventing and managing the global epidemic. Normal: 18.5–24.9 kg/m²" />
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-xl font-bold text-purple">{Math.round(vo2max)}</div>
              <div className="text-xs text-muted flex items-center justify-center gap-1">
                VO2max (gesch.) <ScienceBadge source="Uth-Sørensen-Overgaard-Pedersen (2004): Estimation of VO2max. Med Sci Sports Exerc. Formel: 15 × (HFmax/HFruhe)" />
              </div>
            </Card>
          </div>
        </div>

        {/* HR Zones */}
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            Herzfrequenz
            <ScienceBadge source="Karvonen et al. (1957): The effects of training on heart rate. Ann Med Exp Biol Fenn. HF-Zonen basieren auf % der Herzfrequenzreserve." />
          </h2>
          <Card className="space-y-2">
            {[
              { name: 'Zone 1 – Recovery', pct: '< 60%', bpm: `< ${Math.round(profile.maxHr * 0.6)}`, color: 'bg-gray-500' },
              { name: 'Zone 2 – Aerob', pct: '60–70%', bpm: `${Math.round(profile.maxHr * 0.6)}–${Math.round(profile.maxHr * 0.7)}`, color: 'bg-success' },
              { name: 'Zone 3 – Tempo', pct: '70–80%', bpm: `${Math.round(profile.maxHr * 0.7)}–${Math.round(profile.maxHr * 0.8)}`, color: 'bg-warning' },
              { name: 'Zone 4 – Schwelle', pct: '80–90%', bpm: `${Math.round(profile.maxHr * 0.8)}–${Math.round(profile.maxHr * 0.9)}`, color: 'bg-danger' },
              { name: 'Zone 5 – Max', pct: '> 90%', bpm: `> ${Math.round(profile.maxHr * 0.9)}`, color: 'bg-purple' },
            ].map(z => (
              <div key={z.name} className="flex items-center gap-2 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${z.color} flex-shrink-0`} />
                <span className="text-text-secondary flex-1">{z.name}</span>
                <span className="text-muted text-xs">{z.bpm} bpm</span>
              </div>
            ))}
            <p className="text-xs text-muted pt-1">Basierend auf Max-HF: {profile.maxHr} bpm</p>
          </Card>
        </div>

        {/* Goals */}
        {profile.primaryGoals.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Ziele</h2>
            <div className="flex flex-wrap gap-2">
              {profile.primaryGoals.map(g => (
                <Badge key={g} variant="purple" size="md">{g}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Wearables */}
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Link size={12} /> Verbundene Geräte
          </h2>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Garmin Connect</span>
              <Badge variant={garminService.isConnected() ? 'success' : 'muted'}>
                {garminService.isConnected() ? 'Verbunden' : 'Nicht verbunden'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Polar Flow</span>
              <Badge variant={polarService.isConnected() ? 'success' : 'muted'}>
                {polarService.isConnected() ? 'Verbunden' : 'Nicht verbunden'}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => profile.profileComplete && setEditing(false)} className="text-muted">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">
          {profile.profileComplete ? 'Profil bearbeiten' : 'Profil einrichten'}
        </h1>
      </div>

      {/* Personal */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <User size={14} /> Persönliche Daten
        </h2>
        <Card className="space-y-4">
          <FormRow label="Name">
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="form-input" placeholder="Dein Name" />
          </FormRow>
          <FormRow label="Alter">
            <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: +e.target.value }))}
              className="form-input" />
          </FormRow>
          <FormRow label="Geschlecht">
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${form.gender === g ? 'bg-accent text-bg font-medium' : 'bg-surface-2 text-muted border border-white/10'}`}>
                  {g === 'male' ? 'Männlich' : g === 'female' ? 'Weiblich' : 'Divers'}
                </button>
              ))}
            </div>
          </FormRow>
          <FormRow label="Gewicht (kg)">
            <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: +e.target.value }))}
              className="form-input" />
          </FormRow>
          <FormRow label="Größe (cm)">
            <input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: +e.target.value }))}
              className="form-input" />
          </FormRow>
        </Card>
      </section>

      {/* Heart Rate */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} /> Herzfrequenz
        </h2>
        <Card className="space-y-4">
          <FormRow label="Ruhepuls (bpm)">
            <input type="number" value={form.restingHr} onChange={e => setForm(f => ({ ...f, restingHr: +e.target.value }))}
              className="form-input" />
          </FormRow>
          <FormRow label={<span className="flex items-center gap-1">Max-HF (bpm) <ScienceBadge source="Tanaka et al. (2001): Age-predicted maximal heart rate revisited. JACC, 37(1):153–156. Formel: 208 − 0,7 × Alter (genauer als 220−Alter)" /></span>}>
            <div className="flex items-center gap-2">
              <input type="number" value={form.maxHr} onChange={e => setForm(f => ({ ...f, maxHr: +e.target.value }))}
                className="form-input flex-1" />
              <button onClick={() => setForm(f => ({ ...f, maxHr: maxHrEstimate }))}
                className="text-xs text-accent whitespace-nowrap">
                Auto ({maxHrEstimate})
              </button>
            </div>
          </FormRow>
          <FormRow label="FTP Watt (Rad)">
            <input type="number" value={form.ftp ?? ''} onChange={e => setForm(f => ({ ...f, ftp: +e.target.value }))}
              className="form-input" placeholder="Optional" />
          </FormRow>
        </Card>
      </section>

      {/* Fitness Level */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Fitnesslevel</h2>
        <div className="grid grid-cols-2 gap-2">
          {FITNESS_LEVELS.map(f => (
            <button key={f.value} onClick={() => setForm(fm => ({ ...fm, fitnessLevel: f.value }))}
              className={`rounded-card p-3 border text-left transition-all ${form.fitnessLevel === f.value ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface'}`}>
              <div className="font-medium text-sm text-text-primary">{f.label}</div>
              <div className="text-xs text-muted mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Target size={14} /> Trainingsziele
        </h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => toggleGoal(g)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                form.primaryGoals.includes(g)
                  ? 'bg-purple text-white border-purple'
                  : 'border-white/10 text-muted bg-surface'
              }`}>
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Units */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Einheiten</h2>
        <div className="flex gap-2">
          {(['metric', 'imperial'] as const).map(u => (
            <button key={u} onClick={() => setForm(f => ({ ...f, units: u }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.units === u ? 'bg-accent text-bg' : 'bg-surface-2 text-muted border border-white/10'}`}>
              {u === 'metric' ? 'Metrisch (km, kg)' : 'Imperial (mi, lbs)'}
            </button>
          ))}
        </div>
      </section>

      <Button size="lg" fullWidth onClick={handleSave}>
        <div className="flex items-center justify-center gap-2">
          <Check size={18} /> Profil speichern
        </div>
      </Button>
    </div>
  )
}

function FormRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-text-secondary block">{label}</label>
      {children}
    </div>
  )
}
