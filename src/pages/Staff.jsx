import EmptyState from '../components/EmptyState'
import { UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Mail, Phone, Pencil, UserX, UserCheck } from 'lucide-react'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import Tabs from '../components/Tabs'
import { StatusBadge, Tag } from '../components/Badge'
import Modal from '../components/Modal'
import { FormField, Input, Select, Button, Textarea } from '../components/FormField'
import useStore from '../store/useStore'
import { staffBreakdown, formatINR } from '../lib/attribution'
import { confirm } from '../store/useConfirm'
import useToast from '../store/useToast'

const ROLES = ['Senior Structural Engineer', 'Structural Engineer', 'Junior Engineer', 'Team Lead', 'Project Manager', 'CAD Technician', 'Admin & Accounts']
const DEPARTMENTS = ['Engineering', 'Management', 'Drafting', 'Administration']
const SKILL_OPTIONS = ['RCC Design', 'Steel Structures', 'Foundation Design', 'AutoCAD', 'STAAD Pro', 'ETABS', 'Revit', 'Drafting', 'Detailing', 'Site Visits', 'Project Planning', 'Client Management', 'Quality Control', 'Project Coordination', 'Estimation', 'Seismic Design', 'Post-Tensioning', 'Invoicing', 'Payroll', 'Documentation']

const emptyForm = { name: '', email: '', phone: '', role: '', department: '', hourlyRate: '', monthlySalary: '', joinDate: '', skills: [] }

export default function StaffPage() {
  const staff = useStore(s => s.staff)
  const tasks = useStore(s => s.tasks)
  const timeLogs = useStore(s => s.timeLogs)
  const addStaff = useStore(s => s.addStaff)
  const updateStaff = useStore(s => s.updateStaff)
  const toggleStaffStatus = useStore(s => s.toggleStaffStatus)

  const [selected, setSelected] = useState(null)
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    const id = params.get('person')
    if (id) { setSelected(id); setParams({}, { replace: true }) }
  }, [params, setParams])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')

  const person = selected ? staff.find(s => s.id === selected) : null
  const filtered = filter === 'all' ? staff : staff.filter(s => s.status === filter)

  function getMetrics(staffId) {
    const t = tasks.filter(t => t.assigneeId === staffId)
    const completed = t.filter(t => t.status === 'done').length
    const inProgress = t.filter(t => t.status === 'in-progress').length
    const totalHours = timeLogs.filter(l => l.staffId === staffId).reduce((s, l) => s + l.hours, 0)
    return { tasks: t.length, completed, inProgress, totalHours }
  }

  function openAddForm() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEditForm(person) {
    setForm({
      name: person.name, email: person.email, phone: person.phone,
      role: person.role, department: person.department,
      hourlyRate: String(person.hourlyRate), monthlySalary: String(person.monthlySalary),
      joinDate: person.joinDate, skills: [...person.skills],
    })
    setEditId(person.id)
    setSelected(null)
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form, hourlyRate: Number(form.hourlyRate), monthlySalary: Number(form.monthlySalary) }
    if (editId) {
      updateStaff(editId, data)
    } else {
      addStaff(data)
    }
    setShowForm(false)
  }

  async function handleToggle(p) {
    const activating = p.status !== 'active'
    const open = tasks.filter(t => t.assigneeId === p.id && t.status !== 'done').length
    const ok = await confirm({
      title: activating ? `Activate ${p.name}?` : `Deactivate ${p.name}?`,
      message: activating
        ? 'They will be able to sign in again and will appear in assignee lists.'
        : 'They will lose access to StructFlow and will no longer appear in assignee lists. Their history is kept.',
      details: !activating && open ? [`${open} open job${open > 1 ? 's' : ''} stay assigned to them until you reassign ${open > 1 ? 'them' : 'it'}.`] : [],
      confirmLabel: activating ? 'Activate' : 'Deactivate',
      tone: activating ? 'primary' : 'danger',
    })
    if (!ok) return
    if (!activating) {
      const sure = await confirm({
        title: 'Are you absolutely sure?',
        message: `${p.name} will be signed out and blocked from signing in right away. You can reactivate them later from the Inactive tab.`,
        confirmLabel: 'Yes, deactivate',
        cancelLabel: 'No, keep active',
        tone: 'danger',
      })
      if (!sure) return
    }
    toggleStaffStatus(p.id)
    setSelected(null)
    useToast.getState().show({
      tone: activating ? 'success' : 'warning',
      title: activating ? `${p.name} activated` : `${p.name} deactivated`,
      detail: activating ? 'Can sign in again' : 'Access removed. History is kept.',
      actions: [{ label: 'Undo', onClick: () => useStore.getState().toggleStaffStatus(p.id) }],
    })
  }

  function toggleSkill(skill) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Staff"
        subtitle={`${staff.length} team member${staff.length === 1 ? '' : 's'}`}
        actions={
          <Button onClick={openAddForm}><Plus size={14} /> Add Member</Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <Tabs
            active={filter}
            onChange={setFilter}
            tabs={[
              { id: 'all', label: 'All', count: staff.length, tone: 'brand' },
              { id: 'active', label: 'Active', count: staff.filter(s => s.status === 'active').length, tone: 'success' },
              { id: 'inactive', label: 'Inactive', count: staff.filter(s => s.status !== 'active').length, tone: 'gray' },
            ]}
          />
        </div>
        {staff.length <= 1 && (
          <EmptyState compact icon={UsersRound} title="You are the only one here"
            description="Add the engineers, drafters and managers who will be assigned work. Each gets a sign-in and sees only their own projects."
            action={{ label: 'Add a team member', icon: Plus, onClick: openAddForm }} />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map(s => {
            const metrics = getMetrics(s.id)
            return (
              <div key={s.id} onClick={() => setSelected(s.id)} className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4 cursor-pointer hover:border-surface-400 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} size="lg" interactive={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-surface-900">{s.name}</p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-surface-400 mt-1">{s.role} · {s.department}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {s.skills.slice(0, 3).map(sk => <Tag key={sk}>{sk}</Tag>)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-surface-50">
                  <div><p className="text-2xs text-surface-400">Jobs</p><p className="text-sm font-semibold text-surface-800">{metrics.tasks}</p></div>
                  <div><p className="text-2xs text-surface-400">Completed</p><p className="text-sm font-semibold text-success">{metrics.completed}</p></div>
                  <div><p className="text-2xs text-surface-400">In Progress</p><p className="text-sm font-semibold text-info">{metrics.inProgress}</p></div>
                  <div><p className="text-2xs text-surface-400">Hours</p><p className="text-sm font-semibold text-surface-800 font-mono">{metrics.totalHours}h</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!person} onClose={() => setSelected(null)} title={person?.name || ''} wide>
        {person && (
          <StaffDetail
            person={person}
            tasks={tasks}
            timeLogs={timeLogs}
            staff={staff}
            onEdit={() => openEditForm(person)}
            onToggleStatus={() => handleToggle(person)}
          />
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Staff Member' : 'Add Staff Member'} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi Sharma" required />
            </FormField>
            <FormField label="Role" required>
              <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                <option value="">Select role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@structflow.com" required />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Department" required>
              <Select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Hourly Rate (₹)" required>
              <Input type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="1200" required />
            </FormField>
            <FormField label="Monthly Salary (₹)" required>
              <Input type="number" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} placeholder="85000" required />
            </FormField>
          </div>
          <FormField label="Join Date">
            <Input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
          </FormField>
          <FormField label="Skills">
            <div className="flex gap-2 flex-wrap">
              {SKILL_OPTIONS.map(sk => (
                <button key={sk} type="button" onClick={() => toggleSkill(sk)}
                  className={`h-8 px-3 text-2xs rounded-md border transition-colors ${form.skills.includes(sk) ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium' : 'bg-surface-0 border-surface-200 text-surface-500 hover:border-surface-300'}`}
                >{sk}</button>
              ))}
            </div>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">{editId ? 'Save Changes' : 'Add Member'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function StaffDetail({ person, tasks: allTasks, timeLogs, staff, onEdit, onToggleStatus }) {
  const assignedTasks = allTasks.filter(t => t.assigneeId === person.id)
  const completed = assignedTasks.filter(t => t.status === 'done').length
  const totalHours = timeLogs.filter(l => l.staffId === person.id).reduce((s, l) => s + l.hours, 0)
  const totalEstimated = assignedTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const utilization = totalEstimated > 0 ? Math.round((totalHours / totalEstimated) * 100) : 0
  const totalCost = totalHours * person.hourlyRate
  const completionRate = assignedTasks.length > 0 ? Math.round((completed / assignedTasks.length) * 100) : 0
  const projects = useStore(s => s.projects)
  const projectIds = [...new Set(assignedTasks.map(t => t.projectId))]
  const milestones = useStore(s => s.milestones)
  const money = staffBreakdown(person, { projects, timeLogs, milestones })
  const maxHours = Math.max(1, ...money.rows.map(r => r.hours))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={person.name} size="lg" interactive={false} />
          <div>
            <p className="text-base font-semibold text-surface-900">{person.name}</p>
            <p className="text-sm text-surface-500">{person.role} · {person.department}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
              <span className="flex items-center gap-1"><Mail size={12} /> {person.email}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {person.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={12} /> Edit</Button>
          <Button variant={person.status === 'active' ? 'ghost' : 'secondary'} size="sm" onClick={onToggleStatus}>
            {person.status === 'active' ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${completionRate}%` },
          { label: 'Total Hours', value: `${totalHours}h` },
          { label: 'Cost to Date', value: `₹${(totalCost / 1000).toFixed(0)}K` },
          { label: 'Utilization', value: `${utilization}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-50 border border-surface-300 rounded-lg p-3">
            <p className="text-2xs text-surface-400">{label}</p>
            <p className="text-xl font-bold text-surface-900 font-mono">{value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby={`money-${person.id}`} className="border border-surface-300 rounded-lg overflow-hidden">
        <div className="flex items-baseline justify-between px-4 pt-3">
          <h3 id={`money-${person.id}`} className="text-sm font-semibold text-surface-900">Time, revenue and profit</h3>
          <span className="text-2xs text-surface-400">Paid milestones only</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <div>
            <p className="text-2xs text-surface-400">Revenue generated</p>
            <p className="text-xl font-bold font-mono text-surface-900">{formatINR(money.revenue)}</p>
          </div>
          <div>
            <p className="text-2xs text-surface-400">Profit contributed</p>
            <p className={`text-xl font-bold font-mono ${money.profit >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>{formatINR(money.profit)}</p>
          </div>
          <div>
            <p className="text-2xs text-surface-400">Earns per hour</p>
            <p className="text-xl font-bold font-mono text-surface-900">{formatINR(money.revenuePerHour)}</p>
            <p className="text-2xs text-surface-400">costs ₹{person.hourlyRate.toLocaleString('en-IN')}/h</p>
          </div>
        </div>
        {money.rows.length > 0 ? (
          <table className="w-full text-sm border-t border-surface-300">
            <thead>
              <tr className="text-2xs text-surface-400 bg-surface-50">
                <th className="text-left font-medium px-4 py-2">Project</th>
                <th className="text-left font-medium px-2 py-2">Hours</th>
                <th className="text-right font-medium px-2 py-2">Share</th>
                <th className="text-right font-medium px-2 py-2">Cost</th>
                <th className="text-right font-medium px-2 py-2">Revenue</th>
                <th className="text-right font-medium px-4 py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {money.rows.map(r => (
                <tr key={r.projectId} className="border-t border-surface-200">
                  <td className="px-4 py-2">
                    <p className="text-surface-800 truncate max-w-[180px]">{r.project.name}</p>
                    {!r.billed && <p className="text-2xs text-warning-dark">Not invoiced yet</p>}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-surface-700 w-8">{r.hours}h</span>
                      <span className="h-1.5 rounded bg-primary" style={{ width: `${Math.max(6, (r.hours / maxHours) * 56)}px` }} aria-hidden="true" />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-surface-500">{Math.round(r.share * 100)}%</td>
                  <td className="px-2 py-2 text-right font-mono text-surface-600">{formatINR(r.cost)}</td>
                  <td className="px-2 py-2 text-right font-mono text-surface-800">{formatINR(r.revenue)}</td>
                  <td className={`px-4 py-2 text-right font-mono font-semibold ${r.profit >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>{formatINR(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 pb-4 text-sm text-surface-500">No hours logged yet, so there is nothing to attribute.</p>
        )}
        <p className="px-4 py-2 text-2xs text-surface-400 border-t border-surface-200 bg-surface-50">
          Revenue is split by each person’s share of logged hours on a project.{money.unbilledHours > 0 ? ` ${money.unbilledHours}h sit on work that hasn’t been invoiced yet.` : ''}
        </p>
      </section>

      <div>
        <p className="text-xs text-surface-400 mb-2">Skills</p>
        <div className="flex gap-2 flex-wrap">{person.skills.map(sk => <Tag key={sk}>{sk}</Tag>)}</div>
      </div>

      <div>
        <p className="text-xs text-surface-400 mb-2">Active Projects</p>
        <div className="space-y-2">
          {projectIds.map(pid => {
            const project = projects.find(p => p.id === pid)
            if (!project) return null
            return (
              <div key={pid} className="flex items-center justify-between py-2">
                <span className="text-sm text-surface-700">{project.name}</span>
                <StatusBadge status={project.status} />
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-surface-400 mb-2">Assigned Jobs</p>
        <div className="space-y-1">
          {assignedTasks.slice(0, 8).map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
              <p className="text-sm text-surface-700 truncate flex-1 mr-4">{t.title}</p>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
