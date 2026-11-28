import clsx from 'clsx'

const TONES = {
  gray: { box: 'bg-surface-50 border-surface-300 text-surface-700', dot: 'bg-surface-400' },
  brand: { box: 'bg-brand-50 border-brand-200 text-brand-700', dot: 'bg-brand-600' },
  success: { box: 'bg-success-light border-success-border text-success-dark', dot: 'bg-success' },
  warning: { box: 'bg-warning-light border-warning-border text-warning-dark', dot: 'bg-warning' },
  error: { box: 'bg-danger-light border-danger-border text-danger-dark', dot: 'bg-danger' },
}

const STATUS_TONE = {
  'backlog': 'gray', 'todo': 'gray', 'planning': 'gray', 'pending': 'gray', 'inactive': 'gray', 'on-hold': 'gray',
  'in-progress': 'brand', 'ready': 'warning', 'invoiced': 'brand',
  'review': 'warning',
  'done': 'success', 'completed': 'success', 'paid': 'success', 'active': 'success',
  'overdue': 'error',
}

const PRIORITY_TONE = { low: 'gray', medium: 'brand', high: 'warning', urgent: 'error' }

export function Badge({ tone = 'gray', size = 'md', dot = true, children, className }) {
  const t = TONES[tone]
  const sizes = { sm: 'px-2 py-0.5 gap-1', md: 'px-3 py-1 gap-2' }
  return (
    <span className={clsx('inline-flex items-center rounded-full border text-xs font-medium whitespace-nowrap', sizes[size], t.box, className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', t.dot)} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  // 'planning' is a project that has not started, shown to people as To Do
  const label = status === 'planning' || status === 'todo' ? 'To Do' : status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <Badge tone={STATUS_TONE[status] || 'gray'}>{label}</Badge>
}

export function PriorityBadge({ priority }) {
  return <Badge tone={PRIORITY_TONE[priority] || 'gray'}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>
}

export function Tag({ children, className }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-sm border border-surface-300 bg-surface-0 text-xs font-medium text-surface-700', className)}>
      {children}
    </span>
  )
}

const COUNT_TONES = {
  gray: 'bg-surface-50 border-surface-300 text-surface-700',
  brand: 'bg-brand-50 border-brand-200 text-brand-700',
  success: 'bg-success-light border-success-border text-success-dark',
  warning: 'bg-warning-light border-warning-border text-warning-dark',
  error: 'bg-danger-light border-danger-border text-danger-dark',
}

export const toneForStatus = status => STATUS_TONE[status] || 'gray'

export function CountBadge({ count, tone = 'gray', className }) {
  return (
    <span className={clsx('inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full border text-xs font-semibold', COUNT_TONES[tone], className)}>
      {count}
    </span>
  )
}
