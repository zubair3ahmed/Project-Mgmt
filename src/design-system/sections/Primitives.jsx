import { useState } from 'react'
import { Check, Code2, Copy } from 'lucide-react'
import clsx from 'clsx'

export function useCopy() {
  const [done, setDone] = useState(null)
  const copy = (text, key = 'x') => {
    navigator.clipboard?.writeText(text)
    setDone(key)
    setTimeout(() => setDone(null), 1400)
  }
  return { copy, done }
}

export function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-20 flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-4 border-b border-surface-300">
        <h2 className="text-2xl font-bold text-surface-900 tracking-tight">{title}</h2>
        {description && <p className="text-surface-600 max-w-3xl">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function Sub({ title, children, hint }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-base font-semibold text-surface-900">{title}</h3>
        {hint && <span className="text-sm text-surface-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function CodeBlock({ code, label = 'Copy' }) {
  const { copy, done } = useCopy()
  return (
    <div className="relative rounded-lg bg-surface-900 text-surface-100 overflow-hidden">
      <button
        type="button"
        onClick={() => copy(code)}
        className="absolute top-2 right-2 h-7 px-2 flex items-center gap-1 rounded-md text-xs font-medium text-surface-300 hover:bg-surface-700 transition-colors"
      >
        {done ? <><Check size={14} /> Copied</> : <><Copy size={14} /> {label}</>}
      </button>
      <pre className="p-4 pr-20 overflow-x-auto text-[13px] leading-6 font-mono"><code>{code}</code></pre>
    </div>
  )
}

export function PropsTable({ rows }) {
  return (
    <div className="rounded-lg border border-surface-300 overflow-hidden bg-surface-0">
      <table className="data-table w-full text-sm">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 w-40">Prop</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">Default</th>
            <th className="text-left px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, def, desc]) => (
            <tr key={name}>
              <td className="px-4 py-3 font-mono text-xs text-brand-700">{name}</td>
              <td className="px-4 py-3 font-mono text-xs text-surface-600">{type}</td>
              <td className="px-4 py-3 font-mono text-xs text-surface-500">{def || '-'}</td>
              <td className="px-4 py-3 text-surface-600">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Demo({ id, title, description, importLine, code, props, children, className }) {
  const [open, setOpen] = useState(false)
  return (
    <div id={id} className="scroll-mt-20 rounded-xl border border-surface-300 bg-surface-0 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
          {description && <p className="text-sm text-surface-600 max-w-2xl">{description}</p>}
          {importLine && <code className="mt-1 w-fit text-xs font-mono px-2 py-1 rounded-sm bg-surface-100 text-surface-700">{importLine}</code>}
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={clsx('h-8 px-3 shrink-0 flex items-center gap-2 rounded-md border text-sm font-medium transition-colors', open ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 text-surface-600 hover:bg-surface-50')}
        >
          <Code2 size={16} /> {open ? 'Hide code' : 'Show code'}
        </button>
      </div>
      <div className={clsx('mx-6 mb-6 p-6 rounded-lg border border-surface-200 bg-surface-50', className || 'flex flex-wrap items-center gap-4')}>{children}</div>
      {open && <div className="px-6 pb-6"><CodeBlock code={code} /></div>}
      {props && <div className="px-6 pb-6 flex flex-col gap-3"><h4 className="text-sm font-semibold text-surface-700">Props</h4><PropsTable rows={props} /></div>}
    </div>
  )
}
