import clsx from 'clsx'
import { Check } from 'lucide-react'
import useStore from '../store/useStore'
import { projectProgress } from '../lib/progress'

// One visual for progress and milestones together: a bar split into one segment per milestone,
// sized by its share of the project. A segment turns green when the milestone is achieved.
export default function MilestoneProgress({ project, compact = false, className }) {
  const milestones = useStore(s => s.milestones)
  const tasks = useStore(s => s.tasks)
  const p = projectProgress(project, milestones, tasks)

  if (!p.total) return <p className={clsx('text-xs text-surface-400', className)}>No milestones yet</p>

  const summary = `${p.achieved} of ${p.total} milestones achieved, ${p.percent}% of the project`
  const bar = (
    <div className={clsx('flex gap-0.5 w-full', compact ? 'h-2' : 'h-3')} role="img" aria-label={summary}>
      {p.segments.map(s => (
        <div key={s.milestone.id} title={`${s.milestone.name}: ${s.achieved ? 'achieved' : `${s.done} of ${s.total} jobs done`}`} className="h-full bg-surface-200 first:rounded-l-full last:rounded-r-full overflow-hidden" style={{ width: `${s.share}%` }}>
          <div className={clsx('h-full transition-[width] duration-500', s.achieved ? 'bg-success' : 'bg-brand-400')} style={{ width: `${s.fill}%` }} />
        </div>
      ))}
    </div>
  )

  if (compact) {
    return (
      <div className={clsx('flex flex-col gap-1.5 min-w-36', className)}>
        {bar}
        <p className="text-xs text-surface-500 whitespace-nowrap"><span className="font-mono font-semibold text-surface-700">{p.percent}%</span> · {p.achieved}/{p.total} milestones</p>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-surface-900">Milestone progress</span>
        <span className="text-sm text-surface-500"><span className="font-mono font-semibold text-surface-900">{p.percent}%</span> · {p.achieved} of {p.total} achieved</span>
      </div>
      {bar}
      <ol className="flex gap-0.5 max-md:hidden">
        {p.segments.map(s => (
          <li key={s.milestone.id} className="min-w-0 pr-2" style={{ width: `${s.share}%` }}>
            <p className="flex items-center gap-1 text-xs font-medium text-surface-700 min-w-0">
              {s.achieved && <Check size={12} className="shrink-0 text-success" />}
              <span className="truncate" title={s.milestone.name}>{s.milestone.name}</span>
            </p>
            <p className="text-2xs text-surface-400">{s.achieved ? 'Achieved' : `${s.done}/${s.total} jobs`}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
