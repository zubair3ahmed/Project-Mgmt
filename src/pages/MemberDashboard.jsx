import MilestoneProgress from '../components/MilestoneProgress'
import EmptyState from '../components/EmptyState'
import { Coffee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Play, Plus } from 'lucide-react'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import { Badge, PriorityBadge, CountBadge, toneForStatus } from '../components/Badge'
import { Button } from '../components/FormField'
import { AnimatedNumber, BarChart, Donut } from '../components/charts'
import { useAccess } from '../lib/access'
import useStore from '../store/useStore'

const STATUS_SERIES = [
  { key: 'todo', label: 'To Do', color: '#98a2b3' },
  { key: 'in-progress', label: 'In Progress', color: '#1570ef' },
  { key: 'review', label: 'In Review', color: '#dc6803' },
  { key: 'done', label: 'Done', color: '#079455' },
]

const dayDiff = d => Math.round((new Date(d + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000)

function Card({ title, to, children, className = '' }) {
  return (
    <section className={`bg-surface-0 border border-surface-300 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-base font-semibold text-surface-900">{title}</h2>
        {to && (
          <Link to={to} className="text-sm text-brand-700 font-medium flex items-center gap-1 hover:underline underline-offset-2">
            View all <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export default function MemberDashboard() {
  const { user, staffId, myProjects } = useAccess()
  const tasks = useStore(s => s.tasks)
  const timeLogs = useStore(s => s.timeLogs)
  const updateTaskStatus = useStore(s => s.updateTaskStatus)

  const mine = tasks.filter(t => t.assigneeId === staffId)
  const open = mine.filter(t => t.status !== 'done')
  const dueSoon = open.filter(t => t.dueDate && dayDiff(t.dueDate) <= 7)
  const overdue = open.filter(t => t.dueDate && dayDiff(t.dueDate) < 0)
  const done = mine.filter(t => t.status === 'done').length

  const logs = timeLogs.filter(l => l.staffId === staffId)
  const byDate = {}
  logs.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + l.hours })
  const hoursData = Object.keys(byDate).sort().slice(-7).map(d => ({
    label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: byDate[d],
  }))
  const totalHours = logs.reduce((s, l) => s + l.hours, 0)

  const statusData = STATUS_SERIES.map(s => ({ ...s, value: mine.filter(t => t.status === s.key).length }))
  const queue = [...open].sort((a, b) => (a.dueDate || '9').localeCompare(b.dueDate || '9')).slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (mine.length === 0 && myProjects.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header title={`${greeting}, ${user.name.split(' ')[0]}`} subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />
        <div className="flex-1 overflow-y-auto p-6">
          <EmptyState icon={Coffee} title="Nothing assigned to you yet"
            description="When your admin adds you to a project or assigns you a job, it shows up here with one-click Start and Done. You can also add a job of your own."
            action={{ label: 'Open time log', to: '/time-log' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">
          <div data-tour="kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="My open jobs" value={<AnimatedNumber value={open.length} />} sub={overdue.length ? `${overdue.length} overdue` : 'None overdue'} />
            <StatCard label="Due this week" value={<AnimatedNumber value={dueSoon.length} />} sub="including overdue" />
            <StatCard label="Completed" value={<AnimatedNumber value={done} />} sub={`of ${mine.length} assigned`} />
            <StatCard label="Hours logged" value={<AnimatedNumber value={totalHours} format={n => `${Math.round(n)}h`} />} sub="all time" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div data-tour="up-next" className="lg:col-span-3 flex flex-col"><Card title="Up next" to="/jobs" className="flex-1">
              <ul className="flex flex-col divide-y divide-surface-100 -my-3">
                {queue.map(t => {
                  const d = t.dueDate ? dayDiff(t.dueDate) : null
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{t.title}</p>
                        <p className="text-xs text-surface-500 truncate">{myProjects.find(p => p.id === t.projectId)?.name}</p>
                      </div>
                      <PriorityBadge priority={t.priority} />
                      {d !== null && (
                        <Badge tone={d < 0 ? 'error' : d <= 3 ? 'warning' : 'gray'} dot={false}>
                          {d < 0 ? `${-d}d overdue` : d === 0 ? 'Due today' : `Due in ${d}d`}
                        </Badge>
                      )}
                      {t.status === 'in-progress' || t.status === 'review' ? (
                        <Button size="sm" variant="secondary" onClick={() => updateTaskStatus(t.id, 'done')}><Check size={16} /> Done</Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => updateTaskStatus(t.id, 'in-progress')}><Play size={16} /> Start</Button>
                      )}
                    </li>
                  )
                })}
                {queue.length === 0 && <li className="py-8 text-sm text-surface-500 text-center">You're all caught up. No open jobs.</li>}
              </ul>
            </Card>
          </div>

            <Card title="My job status" className="lg:col-span-2">
              <div className="flex items-center gap-5">
                <Donut data={statusData} size={140} stroke={18} centerValue={mine.length} centerLabel="jobs" />
                <ul className="flex-1 flex flex-col gap-3">
                  {statusData.map(s => (
                    <li key={s.key} className="flex items-center gap-3 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-surface-600 flex-1">{s.label}</span>
                      <CountBadge count={s.value} tone={toneForStatus(s.key)} />
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="My hours" to="/time-log">
              {hoursData.length ? <BarChart data={hoursData} height={140} /> : <p className="text-sm text-surface-500 py-10 text-center">No time logged yet</p>}
            </Card>
            <Card title="My projects" to="/projects">
              <ul className="flex flex-col gap-5">
                {myProjects.slice(0, 4).map(p => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className="block group">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-surface-900 truncate group-hover:text-brand-700">{p.name}</p>
                      </div>
                      <MilestoneProgress project={p} compact />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
