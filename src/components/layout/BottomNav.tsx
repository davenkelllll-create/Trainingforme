import { NavLink } from 'react-router-dom'
import { Home, Activity, BarChart2, Target, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: Activity, label: 'History' },
  { to: '/progress', icon: BarChart2, label: 'Progress' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-white/5 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0',
                isActive ? 'text-accent' : 'text-muted hover:text-text-secondary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]' : ''} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
