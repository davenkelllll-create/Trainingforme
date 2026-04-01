import { type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface rounded-card p-4',
        glow && 'border border-accent/20 shadow-glow',
        !glow && 'border border-white/5',
        onClick && 'cursor-pointer active:scale-95 transition-transform',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
