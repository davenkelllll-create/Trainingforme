import { type ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  trend?: { value: number; positive?: boolean }
  color?: 'accent' | 'purple' | 'success' | 'warning'
}

export function StatCard({ label, value, unit, icon, trend, color = 'accent' }: StatCardProps) {
  return (
    <div className="bg-surface rounded-card p-3 border border-white/5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
        {icon && (
          <span className={clsx(
            'text-sm',
            color === 'accent' && 'text-accent',
            color === 'purple' && 'text-purple',
            color === 'success' && 'text-success',
            color === 'warning' && 'text-warning',
          )}>{icon}</span>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className={clsx(
          'text-2xl font-bold',
          color === 'accent' && 'text-accent',
          color === 'purple' && 'text-purple',
          color === 'success' && 'text-success',
          color === 'warning' && 'text-warning',
        )}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted mb-1">{unit}</span>}
      </div>
      {trend && (
        <span className={clsx(
          'text-xs',
          trend.positive ? 'text-success' : 'text-danger'
        )}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
  )
}
