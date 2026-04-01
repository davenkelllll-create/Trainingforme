import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

export function Button({ variant = 'primary', size = 'md', children, fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-accent text-bg hover:bg-accent-dim shadow-glow': variant === 'primary',
          'bg-surface-2 text-text-primary hover:bg-surface-3 border border-white/10': variant === 'secondary',
          'text-text-secondary hover:text-text-primary hover:bg-surface-2': variant === 'ghost',
          'bg-danger/20 text-danger hover:bg-danger/30 border border-danger/30': variant === 'danger',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-6 py-3.5 text-base': size === 'lg',
        },
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
