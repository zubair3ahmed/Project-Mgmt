import { useState } from 'react'
import { ChevronDown, Sparkles, TriangleAlert } from 'lucide-react'
import clsx from 'clsx'

export function AutoTag({ state = 'auto', why }) {
  const review = state === 'review'
  return (
    <span
      title={why}
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 rounded-xs text-[11px] font-semibold leading-5',
        review ? 'bg-warning-light text-warning-dark' : 'bg-brand-50 text-brand-700'
      )}
    >
      {review ? <TriangleAlert size={11} /> : <Sparkles size={11} />}
      {review ? 'Needs review' : 'Auto'}
    </span>
  )
}

export function SmartSummary({ detected = [], assumed = [], notes = [] }) {
  const [open, setOpen] = useState(false)
  if (!detected.length && !assumed.length && !notes.length) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-surface-800">
          <Sparkles size={16} className="text-brand-600" />
          Smart fill
          <span className="font-normal text-surface-500">
            {detected.length} from your text{assumed.length > 0 && ` · ${assumed.length} assumed`}
          </span>
        </p>
        {assumed.length > 0 && (
          <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
            Why these? <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>

      {detected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {detected.map(d => <span key={d} className="px-2 py-0.5 rounded-sm bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">{d}</span>)}
        </div>
      )}

      {notes.map(n => (
        <p key={n} className="flex items-start gap-2 text-sm text-warning-dark">
          <TriangleAlert size={16} className="shrink-0 mt-0.5" /> {n}
        </p>
      ))}

      {open && (
        <ul className="flex flex-col divide-y divide-surface-200 border-t border-surface-200">
          {assumed.map(a => (
            <li key={a.key} className="flex items-start gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-800"><span className="font-medium">{a.label}:</span> {a.value}</p>
                <p className="text-xs text-surface-500">{a.why}</p>
              </div>
              <button type="button" onClick={a.onUndo} className="text-xs font-semibold text-surface-600 hover:text-danger shrink-0 pt-0.5">Undo</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Starters({ items, onPick }) {
  if (!items.length) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-surface-500">Try one of these</p>
      <div className="flex flex-wrap gap-2">
        {items.map(t => (
          <button key={t} type="button" onClick={() => onPick(t)} className="h-8 px-3 rounded-md border border-surface-300 bg-surface-0 text-sm text-surface-600 hover:bg-surface-50 text-left truncate max-w-full">
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
