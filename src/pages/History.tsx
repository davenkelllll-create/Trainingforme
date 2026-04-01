import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart2, Filter } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatDuration, formatDistance, activityLabel, activityEmoji } from '../utils/calculations'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ActivityType } from '../types'

type Filter = 'all' | ActivityType

export function History() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const workouts = useLiveQuery(() =>
    db.workouts.orderBy('startTime').reverse().toArray()
  )

  const filtered = workouts?.filter(w => filter === 'all' || w.type === filter)

  // Monthly summary for chart
  const monthlyData = useLiveQuery(async () => {
    const months: { month: string; count: number; km: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const start = startOfMonth(d).getTime()
      const end = endOfMonth(d).getTime()
      const ws = await db.workouts.where('startTime').between(start, end).toArray()
      months.push({
        month: format(d, 'MMM', { locale: de }),
        count: ws.length,
        km: Math.round(ws.reduce((a, w) => a + (w.distance ?? 0), 0) / 1000),
      })
    }
    return months
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'run', label: '🏃 Laufen' },
    { key: 'ride', label: '🚴 Rad' },
    { key: 'hike', label: '🥾 Wandern' },
    { key: 'strength', label: '🏋️ Kraft' },
  ]

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        <BarChart2 size={24} className="text-accent" />
        Trainingshistorie
      </h1>

      {/* Monthly Chart */}
      {monthlyData && (
        <Card>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Trainings pro Monat</h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={monthlyData} barSize={20}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={(v: number, name: string) => [v, name === 'count' ? 'Einheiten' : 'km']}
              />
              <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors flex-shrink-0 ${
              filter === f.key
                ? 'bg-accent text-bg font-medium'
                : 'bg-surface-2 text-text-secondary border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Workout list */}
      <div className="space-y-2">
        {filtered?.map(workout => (
          <Card
            key={workout.id}
            onClick={() => navigate(`/workout/${workout.id}`)}
            className="flex items-center gap-3"
          >
            <div className="text-2xl">{activityEmoji(workout.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{activityLabel(workout.type)}</span>
                {workout.effortScore && (
                  <Badge variant={workout.effortScore >= 75 ? 'success' : workout.effortScore >= 50 ? 'accent' : 'muted'}>
                    {workout.effortScore}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted">
                {format(workout.startTime, 'EEEE, dd. MMM', { locale: de })}
              </div>
            </div>
            <div className="text-right text-xs text-text-secondary space-y-0.5 flex-shrink-0">
              <div>{formatDuration(workout.duration)}</div>
              {workout.distance && <div className="text-accent">{formatDistance(workout.distance)}</div>}
              {workout.calories && <div>{workout.calories} kcal</div>}
            </div>
          </Card>
        ))}

        {filtered?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏃</div>
            <p className="text-text-secondary">Noch keine Trainings hier.</p>
            <p className="text-muted text-sm mt-1">Starte dein erstes Training!</p>
          </div>
        )}
      </div>
    </div>
  )
}
