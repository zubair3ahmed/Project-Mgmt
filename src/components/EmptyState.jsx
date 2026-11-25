import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Button } from './FormField'

// What a screen shows before anything exists: a calm illustration, one line on what belongs here,
// and the single next step. `steps` adds a short checklist for first-run screens like the dashboard.
export default function EmptyState({ icon: Icon, title, description, action, secondary, steps, compact, className }) {
  return (
    <div className={clsx('flex flex-col items-center text-center mx-auto', compact ? 'py-12 px-4' : 'py-16 px-4', className)}>
      <div className="relative w-24 h-24 mb-5" aria-hidden="true">
        <svg viewBox="0 0 96 96" className="absolute inset-0 w-full h-full">
          <circle cx="48" cy="48" r="44" fill="none" stroke="var(--color-surface-300)" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
          <circle cx="48" cy="48" r="32" fill="var(--color-brand-50)" />
          <circle cx="80" cy="22" r="3" fill="var(--color-brand-300)" />
          <circle cx="14" cy="64" r="2" fill="var(--color-surface-300)" />
        </svg>
        {Icon && <Icon size={28} strokeWidth={1.75} className="absolute inset-0 m-auto text-brand-600" />}
      </div>
      <h3 className="text-base font-semibold text-surface-900">{title}</h3>
      {description && <p className="text-sm text-surface-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {(action || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {action && <Cta {...action} />}
          {secondary && <Cta variant="secondary" {...secondary} />}
        </div>
      )}
      {steps && (
        <ol className="mt-8 w-full max-w-xl text-left grid gap-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-4 rounded-lg border border-surface-300 bg-surface-0 p-4">
              <span className="w-7 h-7 shrink-0 rounded-full border-2 border-surface-300 text-xs font-semibold text-surface-500 flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-surface-900">{s.title}</p><p className="text-xs text-surface-500">{s.desc}</p></div>
              <Cta variant="secondary" size="sm" {...s} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Cta({ label, to, onClick, icon: Ico, variant = 'primary', size = 'md' }) {
  const btn = <Button variant={variant} size={size} onClick={onClick}>{Ico && <Ico size={16} />}{label}</Button>
  return to ? <Link to={to}>{btn}</Link> : btn
}
