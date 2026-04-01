import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Scale, Bluetooth, Plus, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { db } from '../db/database'
import { useUserStore } from '../store/userStore'
import { bluetoothScaleService } from '../services/bluetoothScale'
import {
  classifyBMI, classifyBodyFat, classifyVisceralFat,
  BODY_METRIC_SOURCES,
} from '../utils/bodyReferenceValues'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScienceBadge } from '../components/ui/ScienceBadge'
import type { BodyMeasurement } from '../types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function BodyTracker() {
  const { profile } = useUserStore()
  const [connecting, setConnecting] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [btError, setBtError] = useState('')
  const [manualForm, setManualForm] = useState({
    weight: String(profile.weight),
    bodyFat: '',
    muscleMass: '',
    waterPercent: '',
    visceralFat: '',
    boneMass: '',
  })

  const measurements = useLiveQuery(() =>
    db.bodyMeasurements.orderBy('timestamp').reverse().limit(60).toArray()
  )

  const latest = measurements?.[0]
  const bmi = latest ? latest.weight / ((profile.height / 100) ** 2) : profile.weight / ((profile.height / 100) ** 2)
  const bmiClass = classifyBMI(bmi)
  const fatClass = latest?.bodyFat ? classifyBodyFat(latest.bodyFat, profile.gender, profile.age) : null
  const visceralClass = latest?.visceralFat ? classifyVisceralFat(latest.visceralFat) : null

  const chartData = [...(measurements ?? [])].reverse().map(m => ({
    date: format(m.timestamp, 'dd.MM', { locale: de }),
    Gewicht: m.weight,
    Körperfett: m.bodyFat,
    Muskelmasse: m.muscleMass ? Math.round(m.muscleMass / m.weight * 1000) / 10 : undefined,
  }))

  const handleBluetooth = async () => {
    setConnecting(true)
    setBtError('')
    try {
      const { measurement, deviceName } = await bluetoothScaleService.connect()
      const entry: BodyMeasurement = {
        timestamp: Date.now(),
        weight: measurement.weight ?? profile.weight,
        bodyFat: measurement.bodyFat,
        muscleMass: measurement.muscleMass,
        boneMass: measurement.boneMass,
        waterPercent: measurement.waterPercent,
        visceralFat: measurement.visceralFat,
        bmr: measurement.bmr,
        metabolicAge: measurement.metabolicAge,
        bmi: Math.round((measurement.weight ?? profile.weight) / ((profile.height / 100) ** 2) * 10) / 10,
        source: 'bluetooth',
        deviceName,
      }
      await db.bodyMeasurements.add(entry)
    } catch (e: unknown) {
      setBtError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen')
    } finally {
      setConnecting(false)
    }
  }

  const handleManualSave = async () => {
    const weight = parseFloat(manualForm.weight)
    if (!weight) return
    const entry: BodyMeasurement = {
      timestamp: Date.now(),
      weight,
      bodyFat: manualForm.bodyFat ? parseFloat(manualForm.bodyFat) : undefined,
      muscleMass: manualForm.muscleMass ? parseFloat(manualForm.muscleMass) : undefined,
      waterPercent: manualForm.waterPercent ? parseFloat(manualForm.waterPercent) : undefined,
      visceralFat: manualForm.visceralFat ? parseFloat(manualForm.visceralFat) : undefined,
      boneMass: manualForm.boneMass ? parseFloat(manualForm.boneMass) : undefined,
      bmi: Math.round(weight / ((profile.height / 100) ** 2) * 10) / 10,
      source: 'manual',
    }
    await db.bodyMeasurements.add(entry)
    setShowManual(false)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Scale size={24} className="text-accent" /> Körper
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowManual(!showManual)}>
            <Plus size={14} />
          </Button>
          <Button size="sm" onClick={handleBluetooth} disabled={connecting || !bluetoothScaleService.isAvailable()}>
            <div className="flex items-center gap-1">
              <Bluetooth size={14} />
              {connecting ? 'Verbinde...' : 'Waage'}
            </div>
          </Button>
        </div>
      </div>

      {!bluetoothScaleService.isAvailable() && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-warning text-sm">⚠️ Web Bluetooth ist in diesem Browser nicht verfügbar. Bitte Chrome oder Edge verwenden. Auf iOS: Bluefy App.</p>
        </Card>
      )}

      {btError && (
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">❌ {btError}</p>
        </Card>
      )}

      {/* Manual Entry Form */}
      {showManual && (
        <Card glow className="space-y-3">
          <h3 className="text-sm font-semibold text-accent">Manuelle Eingabe</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'weight', label: 'Gewicht', unit: 'kg', required: true },
              { key: 'bodyFat', label: 'Körperfett', unit: '%' },
              { key: 'muscleMass', label: 'Muskelmasse', unit: 'kg' },
              { key: 'waterPercent', label: 'Körperwasser', unit: '%' },
              { key: 'visceralFat', label: 'Viszeralfett', unit: '1–20' },
              { key: 'boneMass', label: 'Knochenmasse', unit: 'kg' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted block mb-1">{f.label} {f.required && '*'} <span className="text-muted/60">({f.unit})</span></label>
                <input
                  type="number"
                  step="0.1"
                  value={manualForm[f.key as keyof typeof manualForm]}
                  onChange={e => setManualForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                  className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
                  placeholder={f.unit}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" fullWidth onClick={handleManualSave}>Speichern</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowManual(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      {/* Current Stats */}
      {latest && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Gewicht"
              value={`${latest.weight} kg`}
              source={undefined}
              badge={undefined}
            />
            <MetricCard
              label="BMI"
              value={bmi.toFixed(1)}
              badge={bmiClass}
              source={BODY_METRIC_SOURCES.bmi}
            />
            {latest.bodyFat != null && (
              <MetricCard
                label="Körperfett"
                value={`${latest.bodyFat}%`}
                badge={fatClass ?? undefined}
                source={BODY_METRIC_SOURCES.bodyFat}
              />
            )}
            {latest.muscleMass != null && (
              <MetricCard
                label="Muskelmasse"
                value={`${latest.muscleMass} kg`}
                source={BODY_METRIC_SOURCES.muscleMass}
                badge={undefined}
              />
            )}
            {latest.waterPercent != null && (
              <MetricCard
                label="Körperwasser"
                value={`${latest.waterPercent}%`}
                source={BODY_METRIC_SOURCES.waterPercent}
                badge={undefined}
              />
            )}
            {latest.visceralFat != null && (
              <MetricCard
                label="Viszeralfett"
                value={`${latest.visceralFat}`}
                badge={visceralClass ?? undefined}
                source={BODY_METRIC_SOURCES.visceralFat}
              />
            )}
            {latest.bmr != null && (
              <MetricCard
                label="Grundumsatz"
                value={`${latest.bmr} kcal`}
                source={BODY_METRIC_SOURCES.bmr}
                badge={undefined}
              />
            )}
            {latest.metabolicAge != null && (
              <MetricCard
                label="Stoffwechselalter"
                value={`${latest.metabolicAge} J.`}
                badge={latest.metabolicAge <= profile.age
                  ? { label: 'Unter Chronologisch', color: 'success' }
                  : { label: 'Über Chronologisch', color: 'warning' }}
                source={undefined}
              />
            )}
          </div>

          {/* Trend Chart */}
          {chartData.length > 1 && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Gewichtsverlauf</h3>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v}`, name]}
                  />
                  <Line type="monotone" dataKey="Gewicht" stroke="#00d4ff" strokeWidth={2} dot={false} />
                  {chartData[0]?.Körperfett != null && (
                    <Line type="monotone" dataKey="Körperfett" stroke="#ef4444" strokeWidth={2} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Measurement History */}
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Messungen</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {measurements?.slice(0, 10).map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-muted">{format(m.timestamp, 'dd. MMM, HH:mm', { locale: de })}</span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-accent font-medium">{m.weight} kg</span>
                    {m.bodyFat != null && <span className="text-danger">{m.bodyFat}%</span>}
                    <span className="text-xs text-muted">{m.source === 'bluetooth' ? '📡' : '✏️'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {!latest && !showManual && (
        <Card className="text-center py-10">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-text-primary font-medium">Noch keine Messungen</p>
          <p className="text-muted text-sm mt-1 mb-4">Verbinde eine Bluetooth-Waage oder gib Werte manuell ein.</p>
          <Button onClick={() => setShowManual(true)} variant="secondary">Manuell eingeben</Button>
        </Card>
      )}

      {/* Scientific Reference Info */}
      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <Info size={14} className="text-accent" /> Wissenschaftliche Referenzwerte
        </h3>
        <div className="space-y-2 text-xs text-muted leading-relaxed">
          <p><span className="text-accent font-medium">BMI:</span> WHO-Klassifikation (2000). Normalbereich: 18,5–24,9 kg/m²</p>
          <p><span className="text-accent font-medium">Körperfett %:</span> Gallagher et al. (2000), alters- und geschlechtsspezifisch. Gesunder Bereich Männer 20–39J: 8–20%, Frauen: 21–33%</p>
          <p><span className="text-accent font-medium">Viszeralfett:</span> Tanita/ACSM-Klassifikation. Index 1–9 = normal, 10–14 = erhöht, 15+ = hoch</p>
          <p><span className="text-accent font-medium">Grundumsatz:</span> Mifflin-St-Jeor-Formel (1990), genaueste Schätzung für Nicht-Sportler</p>
        </div>
      </Card>
    </div>
  )
}

function MetricCard({
  label, value, badge, source
}: {
  label: string
  value: string
  badge?: { label: string; color: 'success' | 'accent' | 'warning' | 'danger' | 'muted' } | null
  source?: string
}) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        {source && <ScienceBadge source={source} />}
      </div>
      <div className="text-xl font-bold text-accent">{value}</div>
      {badge && (
        <Badge variant={badge.color}>{badge.label}</Badge>
      )}
    </Card>
  )
}
