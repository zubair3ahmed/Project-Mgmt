import { useState } from 'react'
import clsx from 'clsx'
import useStore from '../store/useStore'
import usePerson from '../store/usePerson'

const PHOTOS = new Set([
  'ravi-sharma', 'priya-patel', 'amit-desai', 'sneha-kulkarni', 'vikram-joshi',
  'meera-nair', 'arjun-mehta', 'kavita-singh', 'zubair-ahmed',
])

const slugOf = name => (name || '').toLowerCase().trim().replace(/\s+/g, '-')

const SIZES = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm', xl: 'w-12 h-12 text-base' }

// interactive: shows a name tooltip and opens the profile card on click.
// Pass interactive={false} when the avatar sits inside another button or link.
export default function Avatar({ name, initials, size = 'md', className, interactive = true }) {
  const [broken, setBroken] = useState(false)
  const person = useStore(s => (interactive && name ? s.staff.find(p => p.name === name) : null))
  const show = usePerson(s => s.show)
  const slug = slugOf(name)
  const photo = PHOTOS.has(slug) && !broken ? `${import.meta.env.BASE_URL}avatars/${slug}.svg` : null
  const display = initials || (name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?')
  const base = clsx(
    'relative group rounded-full flex items-center justify-center bg-brand-50 text-brand-700 border border-surface-200 font-semibold shrink-0',
    SIZES[size], className
  )

  const inner = (
    <>
      {photo ? (
        <img src={photo} alt={name} onError={() => setBroken(true)} className="w-full h-full object-cover rounded-full" draggable={false} />
      ) : display}
      {person && (
        <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 whitespace-nowrap rounded-md bg-surface-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shadow-lg text-left">
          {person.name}
          <span className="block text-[11px] font-normal text-surface-300">{person.role}</span>
        </span>
      )}
    </>
  )

  if (!person) return <div className={base}>{inner}</div>

  return (
    <button
      type="button"
      aria-label={`View ${person.name}`}
      onClick={e => { e.preventDefault(); e.stopPropagation(); show(person.id) }}
      className={clsx(base, 'cursor-pointer hover:z-30 hover:ring-2 hover:ring-brand-200 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600')}
    >
      {inner}
    </button>
  )
}

export function AvatarGroup({ people, max = 4, size = 'sm', interactive = true }) {
  const shown = people.slice(0, max)
  const rest = people.length - max

  return (
    <div className="flex items-center -space-x-2">
      {shown.map(p => (
        <Avatar key={p.id || p.name} name={p.name} initials={p.avatar} size={size} interactive={interactive} className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <div className={clsx('rounded-full flex items-center justify-center bg-surface-100 text-surface-600 font-medium ring-2 ring-white border border-surface-200', size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs')}>
          +{rest}
        </div>
      )}
    </div>
  )
}
