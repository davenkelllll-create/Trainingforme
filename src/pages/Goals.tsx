import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Target, CheckCircle, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import type { Goal } from '../types'

const GOAL_TYPES = [
  { type: 'distance', label: 'Distanz', placeholder: 'z.B. 100 km Laufen/Monat', unit: 'km' },
  { type: 'consistency', label: 'Frequenz', placeholder: 'z.B. 4x Training/Woche', unit: 'mal/Woche' },
  { type: 'weight', label: 'Gewichtsziel', placeholder: 'z.B. 70 kg', unit: 'kg' },
  { type: 'pr', label: 'Persönlicher Rekord', placeholder: 'z.B. 10 km unter 50 min', unit: 'min' },
  { type: 'calories', label: 'Kalorien', placeholder: 'z.B. 3000 kcal/Woche verbrennen', unit: 'kcal' },
]

export function Goals() {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'distance',
    target: '',
    current: '0',
    unit: 'km',
  })

  const goals = useLiveQuery(() =>
    db.goals.orderBy('createdAt').reverse().toArray()
  )

  const active = goals?.filter(g => !g.completed) ?? []
  const completed = goals?.filter(g => g.completed) ?? []

  const handleAdd = async () => {
    if (!form.title || !form.target) return
    await db.goals.add({
      type: form.type as Goal['type'],
      title: form.title,
      target: parseFloat(form.target),
      current: parseFloat(form.current),
      unit: form.unit,
      completed: false,
      createdAt: Date.now(),
    })
    setForm({ title: '', type: 'distance', target: '', current: '0', unit: 'km' })
    setShowAdd(false)
  }

  const handleComplete = async (goal: Goal) => {
    await db.goals.update(goal.id!, { completed: true })
  }

  const handleDelete = async (id: number) => {
    await db.goals.delete(id)
  }

  const getColor = (pct: number) => {
    if (pct >= 100) return 'success' as const
    if (pct >= 60) return 'accent' as const
    if (pct >= 30) return 'purple' as const
    return 'warning' as const
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Target size={24} className="text-warning" />
          Ziele
        </h1>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <div className="flex items-center gap-1"><Plus size={14} /> Ziel</div>
        </Button>
      </div>

      {/* Add Goal Form */}
      {showAdd && (
        <Card glow className="space-y-3">
          <h3 className="text-sm font-semibold text-accent">Neues Ziel</h3>
          <input
            type="text"
            placeholder="Ziel-Titel"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2.5 text-sm border border-white/10 placeholder:text-muted"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">Typ</label>
              <select
                value={form.type}
                onChange={e => {
                  const gt = GOAL_TYPES.find(t => t.type === e.target.value)
                  setForm(f => ({ ...f, type: e.target.value, unit: gt?.unit ?? f.unit }))
                }}
                className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
              >
                {GOAL_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Einheit</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">Zielwert</label>
              <input
                type="number"
                placeholder="100"
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Aktuell</label>
              <input
                type="number"
                value={form.current}
                onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                className="w-full bg-surface-2 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" fullWidth onClick={handleAdd}>Speichern</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Abbrechen</Button>
          </div>
        </Card>
      )}

      {/* Active Goals */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Aktive Ziele</h2>
          {active.map(goal => {
            const pct = Math.min(100, (goal.current / goal.target) * 100)
            const color = getColor(pct)
            return (
              <Card key={goal.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">{goal.title}</div>
                    <div className="text-xs text-muted mt-0.5">{goal.current} / {goal.target} {goal.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={color}>{Math.round(pct)}%</Badge>
                    {pct >= 100 && (
                      <button onClick={() => handleComplete(goal)} className="text-success">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(goal.id!)} className="text-muted hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <ProgressBar value={pct} color={color} size="md" />
                {goal.deadline && (
                  <div className="text-xs text-muted">
                    Deadline: {new Date(goal.deadline).toLocaleDateString('de-DE')}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {active.length === 0 && !showAdd && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-text-primary font-medium">Noch keine Ziele gesetzt</p>
          <p className="text-muted text-sm mt-1">Klicke auf "+ Ziel" um loszulegen.</p>
        </Card>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Erreicht ✓</h2>
          {completed.map(goal => (
            <Card key={goal.id} className="flex items-center gap-3 opacity-60">
              <CheckCircle size={18} className="text-success flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary line-through">{goal.title}</div>
                <div className="text-xs text-muted">{goal.target} {goal.unit}</div>
              </div>
              <button onClick={() => handleDelete(goal.id!)} className="text-muted">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
