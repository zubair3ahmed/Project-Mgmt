import clsx from 'clsx'
import { CountBadge } from './Badge'

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-surface-200">
      {tabs.map(tab => {
        const isActive = active === tab.id
        const tone = tab.tone || (isActive ? 'brand' : 'gray')
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-3 py-3 text-sm font-semibold transition-colors relative',
              isActive
                ? 'text-brand-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-600'
                : 'text-surface-500 hover:text-surface-700'
            )}
          >
            {tab.label}
            {tab.count != null && <CountBadge count={tab.count} tone={tone} />}
          </button>
        )
      })}
    </div>
  )
}
