import { useId, type ReactNode } from 'react'

type SideCardProps = {
  title: string
  badge?: string
  hint?: string
  open: boolean
  onToggle: () => void
  accent?: 'gold' | 'blue' | 'green' | 'muted'
  children: ReactNode
  disabled?: boolean
}

export function SideCard({
  title,
  badge,
  hint,
  open,
  onToggle,
  accent = 'muted',
  children,
  disabled = false,
}: SideCardProps) {
  const bodyId = useId()

  return (
    <section className={`side-card accent-${accent} ${open ? 'open' : 'closed'} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className="side-card-header"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        disabled={disabled}
      >
        <span className="side-card-accent" aria-hidden="true" />
        <span className="side-card-title-wrap">
          <span className="side-card-title">{title}</span>
          {badge && <span className="side-card-badge">{badge}</span>}
        </span>
        {hint && !open && <span className="side-card-hint">{hint}</span>}
        <span className={`side-card-chevron ${open ? 'up' : ''}`} aria-hidden="true" />
      </button>
      <div id={bodyId} className="side-card-body" hidden={!open}>
        {children}
      </div>
    </section>
  )
}
