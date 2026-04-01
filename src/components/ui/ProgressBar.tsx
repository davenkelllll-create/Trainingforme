import clsx from 'clsx'

interface ProgressBarProps {
  value: number // 0-100
  color?: 'accent' | 'purple' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  animated?: boolean
}

export function ProgressBar({ value, color = 'accent', size = 'md', showLabel, label, animated }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-text-primary">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full bg-surface-3 overflow-hidden',
          { 'h-1.5': size === 'sm', 'h-2': size === 'md', 'h-3': size === 'lg' }
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700',
            animated && 'animate-pulse',
            {
              'bg-accent shadow-[0_0_8px_rgba(0,212,255,0.5)]': color === 'accent',
              'bg-purple shadow-[0_0_8px_rgba(124,58,237,0.5)]': color === 'purple',
              'bg-success': color === 'success',
              'bg-warning': color === 'warning',
              'bg-danger': color === 'danger',
            }
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
