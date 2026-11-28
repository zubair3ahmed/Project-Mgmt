import { useState } from 'react'
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { Button, Select } from '../components/FormField'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import useQuickAdd from '../store/useQuickAdd'
import { confirm } from '../store/useConfirm'
import { useAccess } from '../lib/access'

// one colour per project, reused by the chart, the legend and the day breakdown
const COLORS = ['#1570ef', '#0e9384', '#dc6803', '#7a5af8', '#d92d20', '#475467']
const dayLabel = (d, opts) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', opts)
const round = n => Math.round(n * 10) / 10

export default function TimeLog() {
  const allLogs = useStore(s => s.timeLogs)
  const tasks = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const projects = useStore(s => s.projects)
  const deleteTimeLog = useStore(s => s.deleteTimeLog)
  const logHours = useQuickAdd(s => s.logHours)
  const { isAdmin, staffId } = useAccess()
  const [who, setWho] = useState('all')
  const [which, setWhich] = useState('all')

  const mine = isAdmin ? allLogs.filter(l => who === 'all' || l.staffId === who) : allLogs.filter(l => l.staffId === staffId)
  const logs = mine.filter(l => which === 'all' || l.projectId === which)
  const usedProjects = projects.filter(p => mine.some(l => l.projectId === p.id))
  const colorOf = id => COLORS[Math.max(0, projects.findIndex(p => p.id === id)) % COLORS.length]
  const nameOf = id => projects.find(p => p.id === id)?.name || 'Unknown project'

  const days = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a)).map(date => {
    const entries = logs.filter(l => l.date === date)
    const byProject = [...new Set(entries.map(l => l.projectId))].map(id => ({ id, hours: round(entries.filter(l => l.projectId === id).reduce((n, l) => n + l.hours, 0)) }))
    return { date, entries, byProject, total: round(entries.reduce((n, l) => n + l.hours, 0)) }
  })
  const total = round(logs.reduce((n, l) => n + l.hours, 0))
  const chart = days.slice(0, 10).reverse()
  const peak = Math.max(1, ...chart.map(d => d.total))

  async function handleDelete(log) {
    const job = tasks.find(t => t.id === log.taskId)
    const ok = await confirm({ title: 'Delete this time entry?', message: `${log.hours}h on “${job?.title || 'this job'}” (${log.date}) will be removed.`, details: ['The hours logged on the job will be reduced to match.'], confirmLabel: 'Delete entry', tone: 'danger' })
    if (!ok) return
    const snapshot = deleteTimeLog(log.id)
    if (snapshot) useToast.getState().show({ tone: 'danger', title: 'Time entry deleted', detail: `${log.hours}h · ${job?.title || ''}`, actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreTimeLog(snapshot) }] })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Time Log"
        subtitle={isAdmin ? 'Work hours per day across projects' : 'Your work hours per day, across all your projects'}
        actions={<Button onClick={() => logHours()}><Clock size={14} /> Log hours</Button>}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {mine.length === 0 ? (
          <EmptyState icon={Clock} title="No time logged yet" description="Log hours against a job, here or from the job itself. Each day's total across projects appears on this page." action={{ label: 'Log hours', icon: Plus, onClick: () => logHours() }} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <Select size="sm" className="w-auto min-w-40" value={who} onChange={e => setWho(e.target.value)}>
                  <option value="all">All staff</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              )}
              <Select size="sm" className="w-auto min-w-44" value={which} onChange={e => setWhich(e.target.value)}>
                <option value="all">All Projects</option>
                {usedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <p className="ml-auto text-sm text-surface-500"><b className="text-surface-900 font-mono">{total}h</b> over {days.length} day{days.length === 1 ? '' : 's'} · average <b className="text-surface-900 font-mono">{days.length ? round(total / days.length) : 0}h</b> a day</p>
            </div>

            {chart.length > 0 && (
              <section className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4" aria-label="Hours per day by project">
                <h2 className="text-sm font-semibold text-surface-900">Hours per day</h2>
                <p className="text-xs text-surface-500">Last {chart.length} days with time logged, split by project</p>
                <div className="mt-4 flex items-end gap-2 h-44 overflow-x-auto">
                  {chart.map(d => (
                    <a key={d.date} href={`#day-${d.date}`} onClick={e => { e.preventDefault(); document.getElementById(`day-${d.date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="flex-1 min-w-12 h-full flex flex-col items-center justify-end gap-1 group">
                      <span className="text-xs font-mono font-semibold text-surface-700">{d.total}h</span>
                      <span className="w-full max-w-14 flex flex-col-reverse gap-px rounded-t-md overflow-hidden group-hover:opacity-80" style={{ height: `${(d.total / peak) * 70}%` }}>
                        {d.byProject.map(p => <span key={p.id} title={`${nameOf(p.id)}: ${p.hours}h`} style={{ flexGrow: p.hours, background: colorOf(p.id) }} />)}
                      </span>
                      <span className="text-2xs text-surface-500 whitespace-nowrap">{dayLabel(d.date, { day: 'numeric', month: 'short' })}</span>
                    </a>
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {usedProjects.map(p => <li key={p.id} className="flex items-center gap-1.5 text-xs text-surface-600"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorOf(p.id) }} />{p.name}</li>)}
                </ul>
              </section>
            )}

            {days.map(d => (
              <section key={d.date} id={`day-${d.date}`} className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden scroll-mt-4">
                <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-surface-100 border-b border-surface-200">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">{dayLabel(d.date, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
                    <p className="text-xs text-surface-500">{d.byProject.map(p => `${nameOf(p.id)} ${p.hours}h`).join(' · ')}</p>
                  </div>
                  <p className="text-sm text-surface-500"><b className="text-lg font-mono text-surface-900">{d.total}h</b> across {d.byProject.length} project{d.byProject.length === 1 ? '' : 's'}</p>
                </header>
                <ul className="divide-y divide-surface-200">
                  {d.entries.map(log => {
                    const job = tasks.find(t => t.id === log.taskId)
                    const member = staff.find(s => s.id === log.staffId)
                    return (
                      <li key={log.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: colorOf(log.projectId) }} />
                        {isAdmin && member && <Avatar name={member.name} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-800 truncate">{job?.title || 'Deleted job'}</p>
                          <p className="text-xs text-surface-500 truncate">{nameOf(log.projectId)}{isAdmin && member ? ` · ${member.name}` : ''}{log.description ? ` · ${log.description}` : ''}</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-surface-800 w-12 text-right shrink-0">{log.hours}h</span>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => logHours({ entry: log })} aria-label="Edit entry" className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(log)} aria-label="Delete entry" className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 text-surface-500 hover:text-danger"><Trash2 size={13} /></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
            {days.length === 0 && <p className="text-sm text-surface-500 text-center py-8">No hours for this project.</p>}
          </>
        )}
      </div>
    </div>
  )
}
