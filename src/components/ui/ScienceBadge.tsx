import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'

interface ScienceBadgeProps {
  source: string
  inline?: boolean
}

/**
 * Displays a tappable icon that reveals the scientific source
 * for a given metric or recommendation.
 */
export function ScienceBadge({ source, inline }: ScienceBadgeProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        className={`text-accent/60 hover:text-accent transition-colors flex items-center gap-0.5 ${inline ? 'inline-flex' : ''}`}
        title="Wissenschaftliche Quelle"
      >
        <BookOpen size={12} />
        {inline && <span className="text-xs underline underline-offset-2">Quelle</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-white/10 rounded-card w-full max-w-md p-5 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <BookOpen size={16} />
                <span className="font-semibold text-sm">Wissenschaftliche Quelle</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted"><X size={18} /></button>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{source}</p>
          </div>
        </div>
      )}
    </>
  )
}
