import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import Foundations from './sections/Foundations'
import Components from './sections/Components'
import Backend from './sections/Backend'
import Start from './sections/Start'
import Toast from '@/components/Toast'
import PersonDialog from '@/components/PersonDialog'

const NAV = [
  ['Start', [['overview', 'Overview'], ['getting-started', 'Getting started']]],
  ['Foundations', [['colors', 'Colors'], ['typography', 'Typography'], ['spacing', 'Spacing'], ['radius', 'Radius'], ['shadows', 'Shadows'], ['icons', 'Icons'], ['tokens-export', 'Export tokens']]],
  ['Components', [['buttons', 'Button'], ['form-fields', 'Form fields'], ['badges', 'Badges and counts'], ['avatars', 'Avatar'], ['tabs', 'Tabs'], ['cards', 'Cards'], ['tables', 'Data table'], ['progress', 'Progress'], ['alerts', 'Alert'], ['toast', 'Toast'], ['modal', 'Modal'], ['attachments', 'Attachments'], ['charts', 'Charts'], ['smart-fill', 'Smart fill'], ['patterns', 'Patterns']]],
  ['Backend', [['backend-start', 'Quick start'], ['backend-auth', 'Auth and roles'], ['backend-permissions', 'Permissions'], ['backend-rules', 'Business rules'], ['backend-model', 'Data model'], ['backend-endpoints', 'Endpoints'], ['backend-client', 'API client'], ['backend-downloads', 'Downloads']]],
]

export default function DesignSystem() {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const ids = NAV.flatMap(([, items]) => items.map(([id]) => id))
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="sticky top-0 z-30 h-14 bg-surface-0 border-b border-surface-300 flex items-center gap-4 px-6">
        <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-xs">SF</div>
        <span className="font-bold text-surface-900 tracking-tight">StructFlow</span>
        <span className="text-surface-300">/</span>
        <span className="text-sm font-semibold text-surface-700">Design System</span>
        <span className="px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">v1.0</span>
        <a href="./index.html" className="ml-auto h-9 px-3 flex items-center gap-2 rounded-md border border-surface-300 text-sm font-semibold text-surface-700 hover:bg-surface-50"><ArrowLeft size={16} /> Open app</a>
      </header>

      <div className="flex">
        <nav className="hidden lg:block w-64 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-surface-300 bg-surface-100 px-4 py-6">
          {NAV.map(([group, items]) => (
            <div key={group} className="mb-6">
              <p className="px-3 pb-2 text-xs font-semibold text-surface-600 uppercase tracking-wide">{group}</p>
              <div className="flex flex-col gap-0.5">
                {items.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go(id)}
                    className={clsx('h-9 px-3 rounded-md text-sm font-medium text-left transition-colors', active === id ? 'bg-surface-0 text-brand-700 shadow-xs ring-1 ring-surface-300' : 'text-surface-600 hover:bg-surface-300/50 hover:text-surface-900')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10">
          <div className="max-w-5xl flex flex-col gap-16">
            <Start />
            <Foundations />
            <Components />
            <Backend />
          </div>
        </main>
      </div>
      <Toast />
      <PersonDialog />
    </div>
  )
}
