import EmptyState from '../components/EmptyState'
import { BarChart3 } from 'lucide-react'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import Avatar from '../components/Avatar'
import { StatusBadge } from '../components/Badge'
import useStore from '../store/useStore'
import { Link } from 'react-router-dom'
import { staffBreakdown, formatINR } from '../lib/attribution'

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function Reports() {
  const projects = useStore(s => s.projects)
  const tasks = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const milestones = useStore(s => s.milestones)
  const timeLogs = useStore(s => s.timeLogs)

  const projectAnalysis = projects.filter(p => p.status !== 'planning').map(project => {
    const pTasks = tasks.filter(t => t.projectId === project.id)
    const logs = timeLogs.filter(t => t.projectId === project.id)
    const totalHours = logs.reduce((s, t) => s + t.hours, 0)
    const teamCost = logs.reduce((sum, log) => {
      const member = staff.find(s => s.id === log.staffId)
      return sum + (member ? log.hours * member.hourlyRate : 0)
    }, 0)
    const pMilestones = milestones.filter(m => m.projectId === project.id)
    const revenue = pMilestones.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0)
    const margin = revenue > 0 ? ((revenue - teamCost) / revenue) * 100 : 0
    return { ...project, totalHours, teamCost, revenue, margin, taskCount: pTasks.length, completedTasks: pTasks.filter(t => t.status === 'done').length }
  })

  const staffPerformance = staff.filter(s => s.department !== 'Administration').map(s => {
    const sTasks = tasks.filter(t => t.assigneeId === s.id)
    const completed = sTasks.filter(t => t.status === 'done')
    const logs = timeLogs.filter(t => t.staffId === s.id)
    const hours = logs.reduce((sum, t) => sum + t.hours, 0)
    const cost = hours * s.hourlyRate
    const onTimeCount = completed.filter(t => t.completedDate && t.dueDate && t.completedDate <= t.dueDate).length
    const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 0
    const efficiency = sTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
    const efficiencyRate = efficiency > 0 ? Math.round((hours / efficiency) * 100) : 0
    const score = Math.round((completed.length * 25 + onTimeRate * 0.4 + (100 - Math.abs(100 - efficiencyRate)) * 0.35) / (sTasks.length || 1) * 10)
    const money = staffBreakdown(s, { projects, timeLogs, milestones })
    return { ...s, tasks: sTasks.length, completed: completed.length, hours, cost, onTimeRate, efficiencyRate, score: Math.min(score, 100), revenue: money.revenue, profit: money.profit }
  }).sort((a, b) => b.score - a.score)

  const totalRevenue = projectAnalysis.reduce((s, p) => s + p.revenue, 0)
  const totalCost = projectAnalysis.reduce((s, p) => s + p.teamCost, 0)
  const totalHours = projectAnalysis.reduce((s, p) => s + p.totalHours, 0)
  const revenueProjects = projectAnalysis.filter(p => p.revenue > 0)
  const avgMargin = revenueProjects.length > 0 ? revenueProjects.reduce((s, p) => s + p.margin, 0) / revenueProjects.length : 0

  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Reports" subtitle="Project cost analysis & staff performance" />
        <div className="flex-1 overflow-y-auto p-6">
          <EmptyState icon={BarChart3} title="No reports yet"
            description="Margin per project and each person's contribution are worked out from projects, milestones and logged hours. Create a project to begin."
            action={{ label: 'Create a project', to: '/projects' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Project cost analysis & staff performance" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} />
          <StatCard label="Total Staff Cost" value={formatCurrency(totalCost)} />
          <StatCard label="Avg Profit Margin" value={`${Math.round(avgMargin)}%`} />
          <StatCard label="Total Hours Logged" value={`${totalHours}h`} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-surface-900 mb-3">Project Cost Analysis</h2>
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
            <table data-m-hide="3 5 7 8" className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Contract</th>
                  <th className="text-right px-4 py-3">Revenue</th>
                  <th className="text-right px-4 py-3">Staff Cost</th>
                  <th className="text-right px-4 py-3">Margin</th>
                  <th className="text-right px-4 py-3">Hours</th>
                  <th className="text-left px-4 py-3">Jobs</th>
                </tr>
              </thead>
              <tbody>
                {projectAnalysis.map(p => (
                  <tr key={p.id} className="">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-surface-800">{p.name}</p>
                      <p className="text-2xs text-surface-400">{p.type} · {p.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-700 text-right">{formatCurrency(p.contractValue)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-success text-right">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-600 text-right">{formatCurrency(p.teamCost)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-mono font-semibold ${p.margin > 50 ? 'text-success' : p.margin > 20 ? 'text-warning' : 'text-danger'}`}>
                        {p.revenue > 0 ? `${Math.round(p.margin)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-600 text-right">{p.totalHours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-500">{p.completedTasks}/{p.taskCount}</span>
                        <ProgressBar value={p.taskCount > 0 ? (p.completedTasks / p.taskCount) * 100 : 0} className="w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3"><h2 className="text-base font-semibold text-surface-900">Staff Performance</h2><span className="text-xs text-surface-400">Revenue split by share of hours on paid milestones. Select a name for the full breakdown.</span></div>
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
            <table data-m-hide="2 3 4 6 7 8" className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Staff</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-center px-4 py-3">Jobs</th>
                  <th className="text-center px-4 py-3">Completed</th>
                  <th className="text-center px-4 py-3">On-time %</th>
                  <th className="text-right px-4 py-3">Hours</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-right px-4 py-3">Revenue</th>
                  <th className="text-right px-4 py-3">Profit</th>
                  <th className="text-left px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map(s => (
                  <tr key={s.id} className="">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} size="sm" />
                        <Link to={`/staff?person=${s.id}`} className="text-sm font-medium text-surface-800 hover:text-primary hover:underline">{s.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500">{s.role}</td>
                    <td className="px-4 py-3 text-sm text-surface-700 text-center">{s.tasks}</td>
                    <td className="px-4 py-3 text-sm text-success text-center font-medium">{s.completed}</td>
                    <td className="px-4 py-3 text-sm text-surface-700 text-center">{s.onTimeRate}%</td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-600 text-right">{s.hours}h</td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-600 text-right">{formatCurrency(s.cost)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-surface-800 text-right">{formatINR(s.revenue)}</td>
                    <td className={`px-4 py-3 text-sm font-mono font-semibold text-right ${s.profit >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>{formatINR(s.profit)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.score} className="w-16" />
                        <span className="text-xs font-mono text-surface-600 w-8">{s.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
