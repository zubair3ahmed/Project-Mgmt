import MilestoneProgress from '../components/MilestoneProgress'
import EmptyState from '../components/EmptyState'
import { Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import { StatusBadge, Badge, CountBadge, toneForStatus } from '../components/Badge'
import Avatar from '../components/Avatar'
import { AnimatedNumber, BarChart, Donut } from '../components/charts'
import useStore from '../store/useStore'
import useAuth from '../store/useAuth'
import MemberDashboard from './MemberDashboard'

const formatCurrency = n => (n >= 1000000 ? `₹${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `₹${Math.round(n / 1000)}K` : `₹${Math.round(n)}`)

const STATUS_SERIES = [
  { key: 'backlog', label: 'Backlog', color: '#d0d5dd' },
  { key: 'todo', label: 'To Do', color: '#98a2b3' },
  { key: 'in-progress', label: 'In Progress', color: '#1570ef' },
  { key: 'review', label: 'Review', color: '#dc6803' },
  { key: 'done', label: 'Done', color: '#079455' },
]

const dayDiff = d => Math.round((new Date(d + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000)

function Section({ title, to, children, className = '' }) {
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

function AdminDashboard() {
  const projects = useStore(s => s.projects)
  const tasks = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const milestones = useStore(s => s.milestones)
  const timeLogs = useStore(s => s.timeLogs)

  const activeProjects = projects.filter(p => p.status === 'in-progress')
  const doneCount = tasks.filter(t => t.status === 'done').length
  const open = tasks.filter(t => t.status !== 'done')
  const overdue = open.filter(t => t.dueDate && dayDiff(t.dueDate) < 0)
  const collected = milestones.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0)
  const pending = milestones.filter(m => m.paymentStatus === 'pending').reduce((s, m) => s + m.paymentAmount, 0)
  const donePct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  const statusData = STATUS_SERIES.map(s => ({ ...s, value: tasks.filter(t => t.status === s.key).length }))

  const byDate = {}
  timeLogs.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + l.hours })
  const hoursData = Object.keys(byDate).sort().slice(-7).map(d => ({
    label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: byDate[d],
  }))
  const totalHours = hoursData.reduce((s, d) => s + d.value, 0)

  const rank = t => (t.dueDate && dayDiff(t.dueDate) < 0 ? 0 : 1) * 10 + ({ urgent: 0, high: 1, medium: 2, low: 3 }[t.priority] ?? 4)
  const attention = [...open].sort((a, b) => rank(a) - rank(b) || (a.dueDate || '9').localeCompare(b.dueDate || '9')).slice(0, 5)
  const upcoming = milestones.filter(m => m.status !== 'completed').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3)

  if (projects.length === 0 && tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />
        <div className="flex-1 overflow-y-auto p-6">
          <EmptyState icon={Rocket} title="Your workspace is ready"
            description="Numbers, charts and what needs attention appear here once there is work to track. Three steps get you started."
            steps={[
              { title: 'Add your team', desc: 'Engineers, drafters and managers who will pick up jobs.', label: 'Add staff', to: '/staff' },
              { title: 'Create a project', desc: 'One typed line is enough: name, client, value and duration.', label: 'New project', to: '/projects' },
              { title: 'Create a job', desc: 'Link it to a milestone so finishing the last one raises its payment request.', label: 'New job', to: '/jobs' },
            ]} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">
          <div data-tour="kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active projects" value={<AnimatedNumber value={activeProjects.length} />} sub={`${projects.length} total`} />
            <StatCard label="Open jobs" value={<AnimatedNumber value={open.length} />} sub={overdue.length ? `${overdue.length} overdue` : 'None overdue'} />
            <StatCard label="Revenue collected" value={<AnimatedNumber value={collected} format={formatCurrency} />} sub={`${formatCurrency(pending)} pending`} />
            <StatCard label="Jobs completed" value={<AnimatedNumber value={donePct} format={n => `${Math.round(n)}%`} />} sub={`${doneCount} of ${tasks.length}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
            <Section title="Job status" className="xl:col-span-2">
              <div className="flex items-center gap-6">
                <Donut data={statusData} centerValue={tasks.length} centerLabel="jobs" />
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
            </Section>

            <Section title="Hours logged" to="/time-log" className="xl:col-span-3">
              <p className="text-sm text-surface-500 -mt-2 mb-4">
                <span className="text-surface-900 font-semibold">{totalHours}h</span> across the last {hoursData.length} days with time logged
              </p>
              {hoursData.length ? <BarChart data={hoursData} /> : <p className="text-sm text-surface-500 py-10 text-center">No time logged yet</p>}
            </Section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Section title="Needs attention" to="/jobs" className="lg:col-span-3">
              {overdue.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-danger-dark mb-4">
                  <AlertTriangle size={16} /> {overdue.length} job{overdue.length > 1 ? 's are' : ' is'} past due
                </div>
              )}
              <ul className="flex flex-col divide-y divide-surface-100 -my-3">
                {attention.map(t => {
                  const a = staff.find(s => s.id === t.assigneeId)
                  const d = t.dueDate ? dayDiff(t.dueDate) : null
                  return (
                    <li key={t.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{t.title}</p>
                        <p className="text-xs text-surface-500 truncate">{projects.find(p => p.id === t.projectId)?.name}</p>
                      </div>
                      {d !== null && (
                        <Badge tone={d < 0 ? 'error' : d <= 3 ? 'warning' : 'gray'} dot={false}>
                          {d < 0 ? `${-d}d overdue` : d === 0 ? 'Due today' : `Due in ${d}d`}
                        </Badge>
                      )}
                      {a && <Avatar name={a.name} size="sm" />}
                    </li>
                  )
                })}
                {attention.length === 0 && <li className="py-6 text-sm text-surface-500 text-center">Nothing needs attention</li>}
              </ul>
            </Section>

            <Section title="Upcoming milestones" to="/milestones" className="lg:col-span-2">
              <ul className="flex flex-col gap-4">
                {upcoming.map(m => (
                  <li key={m.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{m.name}</p>
                      <p className="text-xs text-surface-500">{projects.find(p => p.id === m.projectId)?.name} · {new Date(m.dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="text-sm font-semibold text-surface-900 font-mono shrink-0">{formatCurrency(m.paymentAmount)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Active projects" to="/projects">
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeProjects.map(p => (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}`} className="block group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate group-hover:text-brand-700">{p.name}</p>
                        <p className="text-xs text-surface-500">{p.location}</p>
                      </div>
                    </div>
                    <MilestoneProgress project={p} compact />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const role = useAuth(s => s.user?.role)
  return role === 'admin' ? <AdminDashboard /> : <MemberDashboard />
}
