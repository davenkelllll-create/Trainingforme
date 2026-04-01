import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
}

export function Layout({ children, hideNav }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <main className={`flex-1 overflow-y-auto ${hideNav ? 'pb-0' : 'pb-20'}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
