import clsx from 'clsx'
import { useMounted } from './charts'

export default function ProgressBar({ value, size = 'sm', className }) {
  const on = useMounted(80)
  const h = size === 'sm' ? 'h-1' : 'h-2'
  const color = value >= 80 ? 'bg-success' : value >= 40 ? 'bg-brand-500' : 'bg-warning'

  return (
    <div className={clsx('w-full bg-surface-100 rounded-full overflow-hidden', h, className)}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', color)}
        style={{ width: on ? `${Math.min(value, 100)}%` : '0%' }}
      />
    </div>
  )
}
