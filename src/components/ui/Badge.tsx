import { type ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'accent' | 'purple' | 'success' | 'warning' | 'danger' | 'muted'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'accent', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        {
          'bg-accent/15 text-accent': variant === 'accent',
          'bg-purple/15 text-purple': variant === 'purple',
          'bg-success/15 text-success': variant === 'success',
          'bg-warning/15 text-warning': variant === 'warning',
          'bg-danger/15 text-danger': variant === 'danger',
          'bg-white/10 text-muted': variant === 'muted',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        }
      )}
    >
      {children}
    </span>
  )
}
