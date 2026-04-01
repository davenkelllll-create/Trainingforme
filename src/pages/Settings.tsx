import { useState } from 'react'
import { Settings as SettingsIcon, User, Activity, Link, Trash2, ChevronRight } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { garminService } from '../services/garminService'
import { polarService } from '../services/polarService'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function Settings() {
  const { profile, updateProfile } = useUserStore()
  const [saved, setSaved] = useState(false)

  const handleSave = (field: string, value: string | number) => {
    updateProfile({ [field]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearData = async () => {
    if (window.confirm('Alle Trainingsdaten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      await db.workouts.clear()
      await db.goals.clear()
      await db.records.clear()
      window.location.reload()
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <SettingsIcon size={24} className="text-muted" />
        Einstellungen
      </h1>

      {saved && (
        <div className="bg-success/15 border border-success/30 rounded-lg px-4 py-2 text-success text-sm">
          ✓ Gespeichert
        </div>
      )}

      {/* Profile */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <User size={14} /> Profil
        </h2>
        <Card className="space-y-4">
          <Field label="Name" value={profile.name} type="text" onSave={v => handleSave('name', v)} />
          <Field label="Alter" value={profile.age} type="number" onSave={v => handleSave('age', v)} unit="Jahre" />
          <Field label="Gewicht" value={profile.weight} type="number" onSave={v => handleSave('weight', v)} unit="kg" />
          <Field label="Größe" value={profile.height} type="number" onSave={v => handleSave('height', v)} unit="cm" />
        </Card>
      </div>

      {/* Heart Rate */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} /> Herzfrequenz
        </h2>
        <Card className="space-y-4">
          <Field label="Ruhepuls" value={profile.restingHr} type="number" onSave={v => handleSave('restingHr', v)} unit="bpm" />
          <Field label="Maximalpuls" value={profile.maxHr} type="number" onSave={v => handleSave('maxHr', v)} unit="bpm" />
          <Field label="FTP (Radfahren)" value={profile.ftp ?? 200} type="number" onSave={v => handleSave('ftp', v)} unit="Watt" />
          <div className="bg-surface-2 rounded-lg p-3 text-xs text-muted">
            💡 Tipp: Max-HF schätzen = 220 – dein Alter ({220 - profile.age} bpm für dich)
          </div>
        </Card>
      </div>

      {/* Wearables */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Link size={14} /> Wearables
        </h2>
        <Card className="space-y-3">
          {/* Garmin */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Garmin Connect</div>
              <div className="text-xs text-muted mt-0.5">Aktivitäten synchronisieren</div>
            </div>
            <div className="flex items-center gap-2">
              {garminService.isConnected() ? (
                <>
                  <Badge variant="success">Verbunden</Badge>
                  <button onClick={() => { garminService.disconnect(); window.location.reload() }} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => garminService.connect()}
                  className="text-accent text-sm flex items-center gap-1"
                >
                  Verbinden <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Polar */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Polar Flow</div>
              <div className="text-xs text-muted mt-0.5">Herzfrequenz & Aktivitäten</div>
            </div>
            <div className="flex items-center gap-2">
              {polarService.isConnected() ? (
                <>
                  <Badge variant="success">Verbunden</Badge>
                  <button onClick={() => { polarService.disconnect(); window.location.reload() }} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => polarService.connect()}
                  className="text-accent text-sm flex items-center gap-1"
                >
                  Verbinden <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Units */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Einheiten</h2>
        <Card>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('units', 'metric')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                profile.units === 'metric' ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'
              }`}
            >
              Metrisch (km)
            </button>
            <button
              onClick={() => handleSave('units', 'imperial')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                profile.units === 'imperial' ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'
              }`}
            >
              Imperial (mi)
            </button>
          </div>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="space-y-2 pt-2">
        <h2 className="text-sm font-semibold text-danger uppercase tracking-wider">Gefahrenzone</h2>
        <Button variant="danger" fullWidth onClick={handleClearData}>
          <div className="flex items-center justify-center gap-2">
            <Trash2 size={16} /> Alle Daten löschen
          </div>
        </Button>
      </div>

      <div className="text-center text-xs text-muted pt-2 pb-4">
        TrainingForMe v1.0 · Offline-First PWA<br />
        Alle Daten werden lokal auf deinem Gerät gespeichert.
      </div>
    </div>
  )
}

function Field({
  label, value, type, onSave, unit
}: {
  label: string
  value: string | number
  type: string
  onSave: (v: string) => void
  unit?: string
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-text-secondary whitespace-nowrap">{label}</label>
      <div className="flex items-center gap-2 flex-1 justify-end">
        {editing ? (
          <>
            <input
              type={type}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={() => { onSave(val); setEditing(false) }}
              onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false) } }}
              autoFocus
              className="w-24 bg-surface-3 text-text-primary rounded-lg px-2 py-1 text-sm border border-accent/50 text-right"
            />
          </>
        ) : (
          <button
            onClick={() => { setVal(String(value)); setEditing(true) }}
            className="text-sm text-accent font-medium"
          >
            {value} {unit}
          </button>
        )}
      </div>
    </div>
  )
}
